export default async function get_data(url, initiator, model, key, operator, value, query ){

    const url_to_name={
        "http://193.168.1.10:5000": "odatis",
        "http://193.168.1.11:5000": "aeris",
        "http://193.168.1.12:5000": "fhir",
        "http://193.168.1.13:5000": "bv-brc",
        "http://193.168.1.14:5000": "data-europa",
        "http://193.168.1.15:5000": "emdb",
        "http://193.168.1.16:5000": "figshare",
        "http://193.168.1.17:5000": "formater",
        "http://193.168.1.18:5000": "humdata",
        "http://193.168.1.19:5000": "opendatasoft",
        "http://193.168.1.20:5000": "theia",
        "http://193.168.1.22:5000": "ncbi",
        "http://193.168.1.23:5000": "engmeta",
        "http://193.168.1.30:5000": "harvard-dataverse"
    }
    console.log("http://localhost:7000/"+url_to_name[url]+"/request")


    const request = new Request("http://localhost:7000/"+url_to_name[url]+"/request", {
        method: "GET",
        headers: {
            "initiator": initiator,
            "model":model,
            "key":key,
            "operator":operator,
            "operand":value,
            "request-id":Date.now().toString(),
            "platform-id":initiator,
            "jump":"0",
            "platforms-visited":"",
            "query":query
        }
    });
    return fetch(request)
        .then(response => {
            console.log(response)

            return response.json()
        })
        .catch(error =>{
            // console.log(error)
            // console.log(error)
        })

}
