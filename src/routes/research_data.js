import './research_data.css';
import {connect} from "react-redux";
import {Autocomplete,TextField, Button} from "@mui/material";
import {React, useEffect, useState} from "react";
import {DataTable} from "mantine-datatable";

import get_data from "../tools/get_data";
import sortBy from "lodash/sortBy";

function ResearchDataPage(props) {

    const [selectedModelId, setSelectedModelId]= useState();
    const [concept, setConcept]= useState("");
    const [operator, setOperator] = useState("");
    const [operand, setOperand] = useState("");


    const [newConcept, setNewConcept]= useState({});
    const [newOperator, setNewOperator] = useState({});
    const [newOperand, setNewOperand] = useState({});
    const [logicalOperator, setLogicalOperator] = useState({});


    const [modelConcepts, setModelConcepts] = useState([]);
    const [localResearch, setLocalResearch] = useState([]);
    const [externalResearch, setExternalResearch] = useState([]);
    const [operatorList, setOperatorList] = useState(["greater than","greater or equal","greater than","lower or equal","equal","in", "not in", "not equal"]);
    const [localListColumns, setLocalListColumns] = useState([]);
    const [sortLocalStatus, setSortLocalStatus] = useState({ columnAccessor: 'name', direction: 'asc' });
    const [externalListColumns, setexternalListColumns] = useState([]);
    const [sortExternalStatus, setSortExternalStatus] = useState({ columnAccessor: 'name', direction: 'asc' });

    // Handler for sorting, not implementend
    // TODO: Add handler for each datatable generated (see button "ADD")
    // useEffect(() => {
    //     const data = sortBy(dataFile, sortStatus.columnAccessor);
    //
    //     setDataFile(sortStatus.direction === 'desc' ? data.reverse() : data);
    // }, [sortStatus]);




    const [modelsList,setModelsList]=useState([]);
    const [data, setData]= useState({});

    var flatten = function(dict){
        var aux_dict = {}
        function recurse(dict,aux_dict, aux_key){
            if (dict){
                if ( dict.constructor === Object){
                    Object.keys(dict).map(
                        (el)=>{
                            if (aux_key === ""){
                                // console.log(el)
                                recurse(dict[el], aux_dict, el)
                            }
                            else {
                                // console.log(aux_key + "_" + el)
                                recurse(dict[el], aux_dict, aux_key+"_"+el)
                            }
                        }
                    )
                }
                if ((dict.constructor !== Array) && (dict.constructor !== Object)){
                    if (aux_key in aux_dict){
                        if (aux_dict[aux_key].constructor === Array){

                            aux_dict[aux_key].push(dict.toString())
                        }
                        else{
                            aux_dict[aux_key] = [aux_dict[aux_key], dict.toString()]
                        }
                    }
                    else {
                        aux_dict[aux_key]=dict.toString()
                    }
                }
                if (dict.constructor === Array){
                    if (!(dict.some((el)=> el.constructor ===Object))){
                        aux_dict[aux_key]=dict
                    }
                //     Array containing dict AND value are not computed
                    else{

                        Object.keys(dict).map(
                            (el)=>{
                                recurse(dict[el], aux_dict, aux_key)
                            }
                        )
                    }
                }
            }
            else{
                aux_dict[aux_key]=""
            }
        }
        recurse(dict,aux_dict,"")

        return aux_dict
    }

    useEffect(() => {
        if (props.context?.models){

            setModelsList(Object.keys(props.context?.models).map((key)=>{
                    return {label: props.context?.models[key].name, id: key}
                })
            )
        }
    }, [props.context?.models]);
    const local_research_table = Object.keys(data).map((el)=>{
        if (el === props.config.ID_PLATFORM){


            if (Object.keys( data[el]).length){
                const aux_data = data[el].map((el)=>{return flatten(el)})
                const columns = Object.keys(aux_data[0]).map((key)=>{return {
                    accessor: key,
                    title: key,
                    textAlignment: 'right',
                    // See handler for datatable (useEffect)
                    // sortable:true,
                    ellipsis:true
                }

                })
                const records = Object.keys(aux_data).map(index=> {
                        const dict_construc_aux = {id:el+index+"external"}

                        Object.keys(aux_data[index]).map((key) =>

                            dict_construc_aux[key] = aux_data[index][key]
                        )
                        return dict_construc_aux
                    }
                );
                return <DataTable
                    id="local_research_datatable"
                    className="external_research_table"
                    withBorder
                    borderRadius="sm"
                    withColumnBorders
                    striped
                    highlightOnHover
                    noRecordsText="No concept to show"
                    textSelectionDisabled
                    columns={columns}
                    records={records}
                    sortStatus={sortExternalStatus}
                    onSortStatusChange={setSortExternalStatus}


                />
            }
        }
        else{
            return ""
        }

    }).filter((el)=>el)
    const [newQueryFields, setNewQueryFields] = useState([]);
    const external_research_table = Object.keys(data).map((el, index)=>{
        if (el !== props.config.ID_PLATFORM){

            if (Object.keys( data[el]).length){
                const aux_data = data[el].map((doc)=>{return flatten(doc)})
                const columns = Object.keys(aux_data[0]).map((key)=>{return {
                    // Change because of automatic drill of Mantine Datatable ; with point-separated accessor, the
                    // library tries to drill in a flat json while it just have to get the label
                    accessor: key.replace(".","_"),
                    title: key,
                    textAlignment: 'right',
                    // sortable:true,
                    ellipsis:true
                }

                })
                const records = Object.keys(aux_data).map(index=> {
                        const dict_construc_aux = {}

                        Object.keys(flatten(aux_data[index])).map((key) =>

                            dict_construc_aux[key.replace(".","_")] = flatten(aux_data[index])[key].toString()
                        )
                        return dict_construc_aux
                    }
                );

                return  <DataTable
                    id={el+"/data_table"}
                    className="external_research_table"
                    withBorder
                    borderRadius="sm"
                    withColumnBorders
                    striped
                    highlightOnHover
                    noRecordsText="No concept to show"
                    textSelectionDisabled
                    columns={columns}
                    records={records}
                    sortStatus={sortExternalStatus}
                    onSortStatusChange={setSortExternalStatus}

                />
            }
        }

        }).filter((el)=>el)
    return (
        <div className="research_data">
            <div  className="query_div">
                <div className="initial_query">
                    <Autocomplete
                        disablePortal
                        id="combo-box-model"
                        options={modelsList}
                        sx={{ width: 300 }}
                        onChange={(event, value)=>{

                            setSelectedModelId(value?.id);
                            setModelConcepts(Object.keys(props.context?.models[value?.id].keys).map((el)=>{
                                return {label: el, type:props.context?.models[value?.id].keys[el]}
                            }));
                        }}
                        renderInput={(params) => <TextField {...params} label="Model" value="id_concept" placeholder="Chose a model to use"/>}
                    />
                    <Autocomplete
                        disablePortal
                        onChange={(event, value) => {

                            setConcept(value?.label)
                        }



                    }
                        id="combo-box-concepts"
                        options={modelConcepts}
                        sx={{ width: 300 }}
                        componentsProps={{
                            paper: {
                                sx: {
                                    overflow:"both",
                                }
                            }
                        }}
                        renderInput={(params) => <TextField {...params} sx={{overflow:"both"}} label="Concept" value="id_concept" placeholder="Concept to request"/>}
                    />
                    <Autocomplete
                        disablePortal

                        id="combo-box-operator"
                        onChange={(event, value) => setOperator(value)}
                        options={operatorList}
                        sx={{ width: 300 }}
                        componentsProps={{
                            paper: {
                                sx: {
                                    overflow:"both",
                                }
                            }
                        }}
                        renderInput={(params) => <TextField {...params} sx={{overflow:"both"}} label="Operator" value="id_operator" placeholder="Operator to use"/>}
                    />
                    <TextField id="outlined-basic" label="Operand" variant="outlined"
                               onChange={(event) => setOperand(event.target.value)}
                    />
                    <Button variant="outlined" onClick={(event) => {

                        setNewQueryFields(newQueryFields.concat([
                            <div className="new_query">
                                <Autocomplete
                                    disablePortal
                                    onChange={(event, value) => {
                                        const id = event.target.id.split("/")[0];
                                        const ret = {}
                                        ret[event.target.id.split("/")[0]]=value
                                        setLogicalOperator({...logicalOperator,...ret})
                                        }
                                    }
                                    id={newQueryFields.length+"/combo-box-logical"}
                                    options={["AND","OR"]}
                                    sx={{ width: 300 }}
                                    componentsProps={{
                                        paper: {
                                            sx: {
                                                overflow:"both",
                                            }
                                        }
                                    }}
                                    renderInput={(params) => <TextField {...params} sx={{overflow:"both"}} label="AND/OR" value="id_concept" placeholder="Concept to request"/>}
                                />
                            <Autocomplete
                                disablePortal
                                onChange={(event, value) => {
                                    const ret = {}
                                    ret[event.target.id.split("/")[0]]=value.label
                                    setNewConcept({...newConcept,...ret})
                                }}
                                id={newQueryFields.length+"/combo-box-concepts"}
                                options={modelConcepts}
                                sx={{ width: 300 }}
                                componentsProps={{
                                    paper: {
                                        sx: {
                                            overflow:"both",
                                        }
                                    }
                                }}
                                renderInput={(params) => <TextField {...params} sx={{overflow:"both"}} label="Concept" value="id_concept" placeholder="Concept to request"/>}
                            />
                            <Autocomplete
                                disablePortal

                                id={newQueryFields.length+"/combo-box-operator"}
                                onChange={(event, value) => {

                                    const id = event.target.id.split("/")[0];
                                    const ret = {}


                                    ret[event.target.id.split("/")[0]]=value
                                    setNewOperator({...newOperator,...ret})
                                }}



                                options={operatorList}
                                sx={{ width: 300 }}
                                componentsProps={{
                                    paper: {
                                        sx: {
                                            overflow:"both",
                                        }
                                    }
                                }}
                                renderInput={(params) => <TextField {...params} sx={{overflow:"both"}} label="Operator" value="id_operator" placeholder="Operator to use"/>}
                            />
                            <TextField id={newQueryFields.length+"/outlined-basic"} label="Operand" variant="outlined"
                                       onChange={(event, value) => {

                                           const id = event.target.id.split("/")[0];
                                           const ret = {}
                                           ret[event.target.id.split("/")[0]]=event.target.value
                                           setNewOperand({...newOperand,...ret})
                                       }}
                            />
                        </div>]))

                    }}>
                        Add
                    </Button>
                    <Button variant="outlined" onClick={(event) => {
                        var request_string = concept.toString() + "#_#SEPARATOR#_#" + operator + "#_#SEPARATOR#_#" + operand ;

                        for (var i = 0;  i<newQueryFields.length; i++) {
                            if ((newConcept[i]) && (newOperand[i]) && (newOperator[i]) && (logicalOperator[i])){
                                request_string += "#_#SEPARATOR#_#" + logicalOperator[i] + "#_#SEPARATOR#_#" + newConcept[i] +"#_#SEPARATOR#_#" + newOperator[i]+ "#_#SEPARATOR#_#"+ newOperand[i]
                            }

                        }
                        setData([])
                        get_data(props.config.URL, props.config.ID_PLATFORM, selectedModelId, concept, operator, operand, request_string).then(data => setData(data))
                    }}>
                        Request
                    </Button>

                </div >
                {newQueryFields}
            </div>
            <div className="query_result_div">

                {/*<div >*/}
                    {local_research_table[0]?
                        <div id={"local_reseach"} className="local_research"><div id={"local_reseach_header"} className="local_research_header">
                        <p style={{textAlign:"center"}}>Local platform query results : {props.context.platforms[props.config.ID_PLATFORM]["name"]} - {(local_research_table[0].props.records.length>1)?
                            local_research_table[0].props.records.length + " datasets found." : local_research_table[0].props.records.length+ "  dataset found."} </p>
                        </div>
                            {local_research_table[0]}
                    </div>
                        :
                        <div id={"local_reseach"} className="local_research"><div id={"local_reseach_header"} className="local_research_header">

                            <p style={{textAlign:"Center"}}>No data from local platform</p> </div></div>}
                {/*</div>*/}
                {external_research_table.map((table,index)=> {
                        return (<div id={index+"_external_research"} className="external_research">
                            <div id={index+"_external_header"} className="external_research_header">
                                <p style={{textAlign:"center"}}>External platform query results : {props.context.platforms[table.props.id.split("/")[0]]["name"]} - {(table.props.records.length>1)? table.props.records.length + " datasets found." : table.props.records.length+ "  dataset found."}</p>

                            </div>
                                {table}
                        </div>)
                    }
                    )}
            </div>
        </div>
    );
}

function mapStateToProps(state) {
    return state
}

export default connect(mapStateToProps)(ResearchDataPage)