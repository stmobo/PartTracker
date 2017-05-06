export function errorHandler(err) {
    if(err instanceof Response) {
        console.error("Request to "+err.url+" returned error "+err.status.toString()+' '+err.statusText);
        console.error(err.body);
    } else if(err instanceof Error) {
        console.error(err.stack);
    } else {
        console.error(err.toString());
    }
}

export function jsonOnSuccess(res) {
    if(!res.ok)
        return Promise.reject(res);

    return res.json();
}
