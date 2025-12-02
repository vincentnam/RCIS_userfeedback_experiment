
export default async function get_registry(url,){
        const request = new Request(url+"/registry", {
            method: "GET",
        });
        return fetch(request)
            .then(response => {
                return response.json()
            })
            .then(data => {
                return (data["data"])
            })

}
