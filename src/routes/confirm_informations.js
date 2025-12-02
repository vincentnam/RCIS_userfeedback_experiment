import './confirm_informations.css';
import {connect} from "react-redux";
import Card from '@mui/material/Card';
import Paper from '@mui/material/Paper';
import {DataTable} from "mantine-datatable";
import {useState} from "react";
import Button from '@mui/material/Button';

import register_platform from "../tools/register_platform_request";
import {Alert, message} from "antd";
import {logDOM} from "@testing-library/react";
import {duration} from "@mui/material";
import uuid from "uuid-by-string";
function ConfirmInformationsPage(props) {
    const platform_name_display = {platform_name:"Platform name :", platform_URL:"Platform URL :",
        mandatory_platform_to_connect_to:"Mandatory platform selected :", platform_to_connect_to:"Chosen platform selected :",
    model_cascader:"Model used :", id_cascader:"Platform ID in registry :"}

    var platform_data_components = [];

    if ((props.root_reducer?.platform)&&(props.context)){
        platform_data_components = Object.keys(props.root_reducer.platform).map((el)=>{
            if((el==="platform_to_connect_to")||(el==="mandatory_platform_to_connect_to")){
                const aux = props.root_reducer?.platform[el].map((el_key)=>props.context?.platforms[el_key].name).join(", ");
                return <div style={{flex: 1, flexDirection: "row", display: "flex"}}>
                    <Paper className="content_info" variant="outlined" style={{
                        flex: 1,
                        textAlign: "left",
                        fontWeight: "initial"
                    }}> {platform_name_display[el]}</Paper>
                    <Paper className="content_info" variant="outlined"
                           style={{flex: 1}}> {aux}</Paper>
                </div>
            }
            else if ((el==="model_cascader")) {
                const aux = props.root_reducer?.platform[el].map((el_key)=> {
                        if (el_key[0] === "Custom model") {
                            return "Custom model"
                        } else {
                            return props.context?.models[el_key[0]].name
                        }
                    }
                ).join(", ");
                return <div style={{flex: 1, flexDirection: "row", display: "flex"}}>
                    <Paper className="content_info" variant="outlined" style={{
                        flex: 1,
                        textAlign: "left",
                        fontWeight: "initial"
                    }}> {platform_name_display[el]}</Paper>
                    <Paper className="content_info" variant="outlined"
                           style={{flex: 1}}> {aux}</Paper>
                </div>
            }
            else {
                return            <div style={{flex:1, flexDirection:"row", display:"flex"}}>
                    <Paper className="content_info" variant="outlined" style={{flex:1, textAlign:"left", fontWeight:"initial"}}> {platform_name_display[el]}</Paper>
                    <Paper className="content_info" variant="outlined" style={{flex:1}}> {props.root_reducer.platform[el]}</Paper>
                </div>
            }

        })
    }

    const [sortStatus, setSortStatus] = useState({ columnAccessor: 'name', direction: 'asc' });
    const [dataFile, setDataFile] = useState(props.root_reducer.model? props.root_reducer.model : []);
    const [listColumns,setListColumns] = useState([
        {
            accessor: 'id',
            title: '#',
            textAlignment: 'right',
            sortable:true,
        },
        { accessor: 'concept',
            title :"Concept",
            sortable:true,
        },
        {
            accessor: 'type',
            title: "Type",
            sortable:true,
        },

    ]);

    const [matchesList, setMatchesList] = useState(props.root_reducer.matches? props.root_reducer.matches : []);
    const [sortStatusMatches, setSortStatusMatches] = useState({ columnAccessor: 'name', direction: 'asc' });

    const [listColumnsMatches,setListColumnsMatches] = useState([
        {
            accessor: 'id',
            title: '#',
            textAlignment: 'right',
            sortable:true,
            width:"auto",
        },
        { accessor: 'ConceptA',
            title :"Concept A",
            sortable:true,
        },
        {
            accessor: 'ModelA',
            title: "Model A",
            sortable:true,
        },
        { accessor: 'ConceptB',
            title :"Concept B",
            sortable:true,
        },
        {
            accessor: 'ModelB',
            title: "Model B",
            sortable:true,
        },

    ]);


    return (
        <div className="confirm_informations_page">
            <div className="header">
                <Paper className="paper_header" >
                    <Button variant="outlined" color="success" onClick={() => {
                        console.log(props)
                        var model_id;
                        var platform_id;
                        model_id = props.config["ID_MODEL"]
                        // if (localStorage.getItem("model_id")) {
                        //     model_id = localStorage.getItem("model_id");
                        // }
                        // else {
                        //     model_id = uuid(props.root_reducer.modelName+Date.now()).toString();
                        //     localStorage.setItem("model_id",model_id)
                        // }
                        // console.log(props)
                        // platform_id = props.config.ID_PLATFORM
                        platform_id = props.root_reducer.platform.id_cascader !== "" ? props.root_reducer.platform.id_cascader : props.config.ID_PLATFORM

                        // if (localStorage.getItem("platform_id")) {
                        //     platform_id = localStorage.getItem("platform_id");
                        // }
                        // else {
                        //     platform_id = props.config.ID_PLATFORM;
                        //     localStorage.setItem("platform_id",platform_id)
                        //
                        // }
                        // console.log(test)
                        const headers = {"Content-Type":"application/json","platform-id":platform_id,
                            "registry-version":Date.now().toString(), "Platforms-Visited":""};
                        const model_link = [];
                        var is_custom_model_added = false;
                        // console.log(headers)
                        if (props.root_reducer){
                            props.root_reducer.platform.model_cascader.forEach(function (model){
                                if (model[0]!=="Custom model"){
                                    model_link.push(model[0]);
                                }
                                else{
                                    is_custom_model_added = true;
                                }

                            })
                            if (model_link) {
                                headers["existing-model-id"]=model_link;
                            }

                        }
                        const body = {};

                        body["models"] = {};
                        const model_keys = {}
                        if ((is_custom_model_added) && (props.root_reducer?.model !==[])) {
                            // console.log(body["models"])

                            body["models"][model_id]={};
                            Object.keys(props.root_reducer.model).map(key => model_keys[props.root_reducer.model[key].concept]=props.root_reducer.model[key].type)
                            body["models"][model_id]["keys"]=model_keys;
                            body["models"][model_id]["name"]=props.root_reducer.modelName
                            body["models"][model_id]["platforms"]=[platform_id]
                        }

                        body["platforms"]={};
                        body["platforms"][platform_id]={}
                        body["platforms"][platform_id]["name"]=props.root_reducer.platform.platform_name;
                        body["platforms"][platform_id]["URL"]=[props.root_reducer.platform.platform_URL];

                        if (props.root_reducer.platform.platform_to_connect_to) {

                            body["platforms"][platform_id]["links"]=props.root_reducer.platform.mandatory_platform_to_connect_to.map((el)=>el[0]).concat(props.root_reducer.platform.platform_to_connect_to?.map((el)=>el[0]));
                        }
                        else {
                            body["platforms"][platform_id]["links"]=props.root_reducer.platform.mandatory_platform_to_connect_to.map((el)=>el[0])

                        }

                        // console.log(register_platform(localStorage.getItem("PlatformURL"), headers, body ))

                        body["matchs"]={}
                        props.root_reducer.matches.map((el)=>{
                                console.log(el);
                                body["matchs"][platform_id+el.id]={keyA:el.ConceptA, keyB:el.ConceptB, modelA:el.ModelA, modelB:el.ModelB, type:"manual", platform_review:[], score:""};
                            }
                        )
                        console.log(props.config.URL)
                        register_platform(props.config.URL, headers, JSON.stringify(body)).then((el) => {
                            if (el[0] === 204) {
                                message.success("Platform successfully registered.", 5)
                                localStorage.removeItem("platform_id");
                                localStorage.removeItem("model_id");
                                localStorage.removeItem("state");
                                setDataFile([]);
                            }
                            else {
                                // console.log(el)
                                message.error("Error : " + el, 5)
                            }
                        }).catch((response) => {
                                // console.log(response)
                                // console.log("TA MERE")
                                message.error("Error : " + response, 5)
                            }
                        );

                        console.log(localStorage)
                    }}
                    >Register all</Button>
                    <Button variant="outlined" color="success" onClick={() => {

                        console.log("Button cliqué")


                    }}
                    >Add model only</Button>
                    <Button variant="outlined" color="success" onClick={() => {

                        localStorage.removeItem("model_id");
                        localStorage.removeItem("platform_id")


                    }}
                    >reset</Button>
                    <Button variant="outlined" color="success" onClick={() => {
                        console.log(props)
                        var model_id;
                        var platform_id;
                        if (localStorage.getItem("model_id")) {
                            model_id = localStorage.getItem("model_id");
                        }
                        else {
                            model_id = uuid(props.root_reducer.modelName+Date.now()).toString();
                            localStorage.setItem("model_id",model_id)
                        }
                        // console.log(props)
                        // platform_id = props.config.ID_PLATFORM
                        platform_id = props.root_reducer.platform.id_cascader !== "" ? props.root_reducer.platform.id_cascader : props.config.ID_PLATFORM

                        // if (localStorage.getItem("platform_id")) {
                        //     platform_id = localStorage.getItem("platform_id");
                        // }
                        // else {
                        //     platform_id = props.config.ID_PLATFORM;
                        //     localStorage.setItem("platform_id",platform_id)
                        //
                        // }
                        // console.log(test)
                        const headers = {"Content-Type":"application/json","platform-id":platform_id,
                            "registry-version":Date.now().toString(), "Platforms-Visited":"", "only-matches":""};
                        const body = {};

                        body["matchs"]={}
                        props.root_reducer.matches.map((el)=>{
                                console.log(el);
                                body["matchs"][platform_id+el.id+Date.now()]={keyA:el.ConceptA, keyB:el.ConceptB, modelA:el.ModelA, modelB:el.ModelB, type:"manual", platform_review:[], score:""};
                            }
                        )
                        register_platform(props.config.URL, headers, JSON.stringify(body)).then((el) => {
                            if (el[0] === 204) {
                                message.success("Matches successfully registered.", 5)
                                localStorage.removeItem("platform_id");
                                localStorage.removeItem("model_id");
                                localStorage.removeItem("state");
                                setDataFile([]);
                            }
                            else {
                                // console.log(el)
                                message.error("Error : " + el, 5)
                            }
                        }).catch((response) => {
                                // console.log(response)
                                // console.log("TA MERE")
                                message.error("Error : " + response, 5)
                            }
                        );


                    }}
                    >Add matches only</Button>
                </Paper>

            </div>

            <div className="platform_viz">
                <Card variant="outlined" className="card">
                    <Paper elevation={1}>Platform informations</Paper>
                    {platform_data_components}
                </Card>
            </div>
            <div className="model_viz">
                <Card className="card">
                    <Paper elevation={1}>Model informations</Paper>
                    <div style={{  height:"92%", maxHeight:"100%", overflow:"auto"}}>
                        <DataTable
                            className="dataTablemodel"
                            withBorder
                            borderRadius="sm"
                            withColumnBorders
                            striped
                            highlightOnHover
                            noRecordsText="No concept to show"
                            textSelectionDisabled
                            columns={listColumns}
                            records={dataFile}
                            sortStatus={sortStatus}
                            onSortStatusChange={setSortStatus}
                        />
                    </div>
                </Card>
            </div>
            <div className="matches_viz">
                <Card className="card">
                    <Paper elevation={1}>Matches informations</Paper>
                    <div style={{height:"92%", maxHeight:"100%", overflow:"auto"}}>
                        <DataTable
                            key="match_datatable"
                            className="dataTablemodel"
                            withBorder
                            borderRadius="sm"
                            withColumnBorders
                            striped
                            highlightOnHover
                            noRecordsText="No match to show"
                            textSelectionDisabled
                            columns={listColumnsMatches}
                            records={matchesList}
                            sortStatus={sortStatusMatches}
                            onSortStatusChange={setSortStatusMatches}

                        />
                    </div>
                </Card>
            </div>
        </div>
    );
}

function mapStateToProps(state) {
    // const { todos } = state
    return state
}

export default connect(mapStateToProps)(ConfirmInformationsPage)