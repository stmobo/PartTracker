var express = require('express');
var util = require('util');
var monk = require('monk');
var ObjectID = require('mongodb').ObjectID;
var type = require('type-detect');
var chai = require('chai');

chai.use(require('chai-http'));
chai.use(require('chai-as-promised'));
should = chai.should();
expect = chai.expect;

var dbAPI = require('api/db.js');
var routing_common = require('api/routing_common.js');
var req_common = require('test/support/request_common.js')

var User = require('api/models/User.js');
var Activity = require('api/models/Activity.js');
var app = req_common.isolate_module(require('api/time_tracking.js'));

describe('Routes: /api/activities', function () {
    beforeEach(async function () {
        app.current_user = undefined;
        app.fake_user.admin = true;
        app.fake_user.activityCreator = true;

        return dbAPI.activities.remove({});
    });

    describe('GET /api/activities', function () {
        it('should return a list of all Activities in the database', async function () {
            var activityA = await Activity.generate();
            var activityB = await Activity.generate();

            var result = await Promise.all([
                activityA.summary(),
                activityB.summary(),
            ]);

            var normalizedResult = JSON.parse(JSON.stringify(result));

            var res = await chai.request(app)
                .get('/api/activities')
                .set('Accept', 'application/json')
                .catch(req_common.catch_failed_requests);

            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.have.deep.members(normalizedResult);
        });
    });

    describe('POST /api/activities', function () {
        it('should create a new Activity', async function () {
            var payload = {
                title: 'title',
                description: 'description',
                startTime: (new Date()).toISOString(),
                endTime: (new Date(Date.now()+(1000*1000))).toISOString(),
                maxHours: 9999
            };

            var res = await chai.request(app)
                .post('/api/activities')
                .set('Accept', 'application/json')
                .send(payload)
                .catch(req_common.catch_failed_requests);

            expect(res).to.have.status(201);
            expect(res).to.be.json;
            expect(res.body).to.deep.include(payload);
        });

        it('should return 403 Forbidden for unauthorized users', async function () {
            app.fake_user.activityCreator = false;
            var res = await chai.request(app)
                .post('/api/activities')
                .send({})
                .catch(req_common.pass_failed_requests);

            expect(res).to.have.status(403);
        });
    });


    describe('Routes: /api/activities/:aid', function () {
        describe('All Routes', function () {
            it('should return 404 Not Found for nonexistent Activities', async function () {
                var res = await chai.request(app)
                    .get(`/api/activities/${monk.id().toString()}`)
                    .catch(req_common.pass_failed_requests);

                expect(res).to.have.status(404);
            });
        });

        describe('GET /api/activities/:aid', function () {
            it('should return information on a specific Activity', async function () {
                var activity = await Activity.generate();

                var res = await chai.request(app)
                    .get(`/api/activities/${activity.id().toString()}`)
                    .set('Accept', 'application/json')
                    .catch(req_common.catch_failed_requests);

                var normalizedResult = await JSON.parse(JSON.stringify(await activity.summary()));

                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.eql(normalizedResult);
            });
        });

        describe('GET /api/activities/:aid/checkin', function () {
            it('should check the current User into an Activity', async function () {
                var activity = await Activity.generate();
                var user = await User.generate();

                app.current_user = user.id();
                var res = await chai.request(app)
                    .get(`/api/activities/${activity.id().toString()}/checkin`)
                    .set('Accept', 'application/json')
                    .catch(req_common.catch_failed_requests);

                expect(res).to.have.status(201); // yes, 201 Created -- we create a checkin object
                expect(res).to.be.json;

                activity = new Activity(activity.id());
                var normalizedResult = await JSON.parse(JSON.stringify(await activity.userHours()));

                expect(normalizedResult).to.have.lengthOf(1);
                expect(normalizedResult[0].user).to.equal(user.id().toString());
                expect(res.body).to.eql(normalizedResult[0]);
            });

            it('should reject duplicate checkins', async function () {
                var activity = await Activity.generate();
                var user = await User.generate();
                var checkin = await Activity.generate_checkin(user, activity);

                await activity.userHours([checkin]);
                await activity.save();

                app.current_user = user.id();
                var res = await chai.request(app)
                    .get(`/api/activities/${activity.id().toString()}/checkin`)
                    .set('Accept', 'application/json')
                    .catch(req_common.pass_failed_requests);

                expect(res).to.have.status(400);
            });
        });

        describe('PUT /api/activities/:aid', function () {
            it('should update a specific Activity', async function () {
                var activity = await Activity.generate();
                var user = await User.generate();
                var checkin = await Activity.generate_checkin(user, activity);

                var payload = {
                    title: 'Foobar',
                    description: 'a description',
                    startTime: (new Date(Date.now()-10*1000)).toISOString(),
                    endTime: (new Date(Date.now()+10*1000)).toISOString(),
                    maxHours: 9999,
                    userHours: [checkin]
                }

                var old_summary = JSON.parse(JSON.stringify(await activity.summary()));
                var res = await chai.request(app)
                    .put(`/api/activities/${activity.id().toString()}`)
                    .set('Accept', 'application/json')
                    .send(payload)
                    .catch(req_common.catch_failed_requests);

                expect(res).to.have.status(200);
                expect(res).to.be.json;

                activity = new Activity(activity.id());
                var new_summary = JSON.parse(JSON.stringify(await activity.summary()));
                expect(new_summary).to.not.eql(old_summary);

                expect(res.body).to.eql(new_summary);
                expect(new_summary).to.deep.include(payload);
            });

            it('should return 403 Forbidden for unauthorized users', async function () {
                var activity = await Activity.generate();

                app.fake_user.activityCreator = false;
                var res = await chai.request(app)
                    .put(`/api/activities/${activity.id().toString()}`)
                    .send({})
                    .catch(req_common.pass_failed_requests);

                expect(res).to.have.status(403);
            });
        });

        describe('DELETE /api/activities/:aid', function () {
            it('should delete a specific Activity', async function () {
                var activity = await Activity.generate();

                var res = await chai.request(app)
                    .delete(`/api/activities/${activity.id().toString()}`)
                    .catch(req_common.catch_failed_requests);

                expect(res).to.have.status(204);
                expect(res.body).to.be.empty;

                activity = new Activity(activity.id());
                return expect(activity.exists()).to.become(false);
            });

            it('should return 403 Forbidden for unauthorized users', async function () {
                var activity = await Activity.generate();

                app.fake_user.activityCreator = false;
                var res = await chai.request(app)
                    .delete(`/api/activities/${activity.id().toString()}`)
                    .catch(req_common.pass_failed_requests);

                expect(res).to.have.status(403);
            });
        });
    });

    describe('Routes: /api/activities/:aid/users', function () {
        describe('GET /api/activities/:aid/users', function () {
            it('should return information on all of the checked-in Users for this Activity', async function () {
                var activity = await Activity.generate();
                var userA = await User.generate();
                var userB = await User.generate();
                var checkins = await Promise.all([
                    Activity.generate_checkin(userA, activity),
                    Activity.generate_checkin(userB, activity),
                ]);

                await activity.userHours(checkins);
                await activity.save();

                var res = await chai.request(app)
                    .get(`/api/activities/${activity.id().toString()}/users`)
                    .set('Accept', 'application/json')
                    .catch(req_common.catch_failed_requests);

                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.have.deep.members(checkins);
            });
        });

        describe('PUT /api/activities/:aid/users', function () {
            it('should update / replace all of the check-ins for this Activity', async function () {
                var activity = await Activity.generate();
                var userA = await User.generate();

                await activity.userHours([await Activity.generate_checkin(userA, activity)]);
                await activity.save();

                var userB = await User.generate();
                var payload = await Promise.all([
                    Activity.generate_checkin(userA, activity),
                    Activity.generate_checkin(userB, activity),
                ]);

                var old_summary = JSON.parse(JSON.stringify(await activity.userHours()));

                var res = await chai.request(app)
                    .put(`/api/activities/${activity.id().toString()}/users`)
                    .set('Accept', 'application/json')
                    .send(payload)
                    .catch(req_common.catch_failed_requests);

                expect(res).to.have.status(200);
                expect(res).to.be.json;

                activity = new Activity(activity.id());

                var normalizedResult = JSON.parse(JSON.stringify(await activity.userHours()));
                expect(res.body).to.have.deep.members(payload);
                expect(normalizedResult).to.not.have.deep.members(old_summary);
                expect(normalizedResult).to.have.deep.members(payload);
            });

            it('should return 403 Forbidden for unauthorized users', async function () {
                var activity = await Activity.generate();

                app.fake_user.activityCreator = false;
                var res = await chai.request(app)
                    .put(`/api/activities/${activity.id().toString()}/users`)
                    .send([])
                    .catch(req_common.pass_failed_requests);

                expect(res).to.have.status(403);
            });
        });

        describe('POST /api/activities/:aid/users', function () {
            it('should create a new check-in for this Activity', async function () {
                var activity = await Activity.generate();
                var user = await User.generate();
                var checkin = await Activity.generate_checkin(user, activity);

                var res = await chai.request(app)
                    .post(`/api/activities/${activity.id().toString()}/users`)
                    .set('Accept', 'application/json')
                    .send(checkin)
                    .catch(req_common.catch_failed_requests);

                expect(res).to.have.status(201);
                expect(res).to.be.json;

                activity = new Activity(activity.id());
                var normalizedResult = await JSON.parse(JSON.stringify(await activity.userHours()));

                expect(normalizedResult).to.eql([checkin]);
                expect(res.body).to.eql(checkin);
            });

            it('should return 403 Forbidden for unauthorized users', async function () {
                var activity = await Activity.generate();

                app.fake_user.activityCreator = false;
                var res = await chai.request(app)
                    .post(`/api/activities/${activity.id().toString()}/users`)
                    .send({})
                    .catch(req_common.pass_failed_requests);

                expect(res).to.have.status(403);
            });
        });

        describe('DELETE /api/activities/:aid/users', function () {
            it('should delete all check-ins for this Activity', async function () {
                var activity = await Activity.generate();
                var userA = await User.generate();
                var userB = await User.generate();
                var checkins = await Promise.all([
                    Activity.generate_checkin(userA, activity),
                    Activity.generate_checkin(userB, activity),
                ]);

                await activity.userHours(checkins);
                await activity.save();

                expect(await activity.userHours()).to.have.lengthOf.above(0);

                var res = await chai.request(app)
                    .delete(`/api/activities/${activity.id().toString()}/users`)
                    .set('Accept', 'application/json')
                    .catch(req_common.catch_failed_requests);

                expect(res).to.have.status(204);
                expect(res.body).to.be.empty;

                activity = new Activity(activity.id());
                expect(await activity.userHours()).to.have.lengthOf(0);
            });


            it('should return 403 Forbidden for unauthorized users', async function () {
                var activity = await Activity.generate();

                app.fake_user.activityCreator = false;
                var res = await chai.request(app)
                    .delete(`/api/activities/${activity.id().toString()}/users`)
                    .catch(req_common.pass_failed_requests);

                expect(res).to.have.status(403);
            });
        });
    });

    describe('Routes: /api/activities/:aid/users/:uid', function () {
        describe('All Routes', function () {
            it('should return 404 Not Found if the referenced User has not checked in to this Activity', async function () {
                var activity = await Activity.generate();

                var res = await chai.request(app)
                    .get(`/api/activities/${activity.id().toString()}/users/${monk.id().toString()}`)
                    .catch(req_common.pass_failed_requests);

                expect(res).to.have.status(404);
            });
        });

        describe('GET /api/activities/:aid/users/:uid', function () {
            it("should get info on a specific User's checkin for this Activity", async function () {
                var activity = await Activity.generate();
                var user = await User.generate();
                var checkin = await Activity.generate_checkin(user, activity);

                await activity.userHours([checkin]);
                await activity.save();

                var res = await chai.request(app)
                    .get(`/api/activities/${activity.id().toString()}/users/${user.id().toString()}`)
                    .catch(req_common.catch_failed_requests);

                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.eql(checkin);
            });
        });

        describe('PUT /api/activities/:aid/users/:uid', function () {
            it("should update a specific User's checkin for this Activity", async function () {
                var activity = await Activity.generate();
                var userA = await User.generate();
                var userB = await User.generate();
                var checkin = await Activity.generate_checkin(userA, activity);

                await activity.userHours([checkin]);
                await activity.save();

                var payload = {
                    user: userB.id().toString(),
                    hours: 10,
                    checkIn: (new Date(Date.now()+(1000*1000))).toISOString()
                };

                var res = await chai.request(app)
                    .put(`/api/activities/${activity.id().toString()}/users/${userA.id().toString()}`)
                    .send(payload)
                    .catch(req_common.catch_failed_requests);

                expect(res).to.have.status(200);
                expect(res).to.be.json;

                activity = new Activity(activity.id());

                var normalizedResult = JSON.parse(JSON.stringify(await activity.userHours()));

                expect(normalizedResult).to.have.lengthOf(1);
                expect(normalizedResult[0]).to.eql(payload);
                expect(res.body).to.eql(payload);
            });

            it('should return 403 Forbidden for unauthorized users', async function () {
                var activity = await Activity.generate();
                var user = await User.generate();
                var checkin = await Activity.generate_checkin(user, activity);

                await activity.userHours([checkin]);
                await activity.save();

                app.fake_user.activityCreator = false;
                var res = await chai.request(app)
                    .put(`/api/activities/${activity.id().toString()}/users/${user.id().toString()}`)
                    .send({})
                    .catch(req_common.pass_failed_requests);

                expect(res).to.have.status(403);
            });
        });

        describe('DELETE /api/activities/:aid/users/:uid', function () {
            it("should delete a specific User's checkin for this Activity", async function () {
                var activity = await Activity.generate();
                var user = await User.generate();
                var checkin = await Activity.generate_checkin(user, activity);

                await activity.userHours([checkin]);
                await activity.save();

                expect(await activity.userHours()).to.have.lengthOf.above(0);

                var res = await chai.request(app)
                    .delete(`/api/activities/${activity.id().toString()}/users/${user.id().toString()}`)
                    .catch(req_common.catch_failed_requests);

                expect(res).to.have.status(204);
                expect(res.body).to.be.empty;

                activity = new Activity(activity.id());
                expect(await activity.userHours()).to.have.lengthOf(0);
            });

            it('should return 403 Forbidden for unauthorized users', async function () {
                var activity = await Activity.generate();
                var user = await User.generate();
                var checkin = await Activity.generate_checkin(user, activity);

                await activity.userHours([checkin]);
                await activity.save();

                app.fake_user.activityCreator = false;
                var res = await chai.request(app)
                    .delete(`/api/activities/${activity.id().toString()}/users/${user.id().toString()}`)
                    .catch(req_common.pass_failed_requests);

                expect(res).to.have.status(403);
            });
        });
    });
});
