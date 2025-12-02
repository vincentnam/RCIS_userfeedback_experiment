import './create_match.css';
import {TreeItem, TreeView} from "@mui/x-tree-view";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import {useState} from 'react';
import {Stack} from "@mui/material";
import {connect} from "react-redux";

function CreateMatchPage(props) {
    var plat_tree = [];
    var model_tree = [];
    const [conceptA, setConceptA] = useState("");
    const [conceptB, setConceptB] = useState("");
    const [selectedRow, setSelectedRow] = useState([]);
    const [id_aux, setId_aux] = useState(props.root_reducer.id_match? props.root_reducer.id_match : 0 );
    if (props.context != null) {
        model_tree = Object.keys(props.context["models"]).map
        (
            (key) =>
                (
                    <TreeItem nodeId={key} label={props.context["models"][key]["name"]}>
                        <TreeItem nodeId={key + "_id"} label={"id : " + key}/>
                        {

                            Object.keys(props.context["models"][key]).map
                            (
                                key_plat =>
                                    (
                                        key_plat === "keys" ?
                                            <TreeItem nodeId={key + "_" + key_plat} label={key_plat.toString()}>

                                                {
                                                    Object.keys(props.context["models"][key]["keys"]).map(
                                                        (concept) =>
                                                        <TreeItem
                                                            nodeId={key + "." +
                                                                key_plat + "." + concept.toString()}
                                                            label={concept.toString()}/>
                                                    )
                                                }
                                            </TreeItem>
                                            : <TreeItem nodeId={key + "_" + key_plat}
                                                        label={key_plat + " : " + props.context["models"][key][key_plat].toString()}/>
                                    )
                            )
                        }
                    </TreeItem>


                )
        )

    }

    if (props.root_reducer.model){
        model_tree.unshift(
            <TreeItem nodeId={"custom_model_key"} label={"New model"}>
                <TreeItem nodeId={"custom_model_id"} label={"id : Undefined"}/>
                <TreeItem nodeId={"custom_model_keys"} label={"keys"}>
                    {props.root_reducer.model
                        .sort(function(a,b){return a.concept.localeCompare(b.concept);})
                        .map((el)=>{
                        return <TreeItem nodeId={props.root_reducer.modelId+".key." + el.concept} label={el.concept}/>
                    })}
                </TreeItem>
            </TreeItem>


        )
    }



    // ##########################################################################################
    const columns = [
        { field: 'id', headerName: 'Match ID', width: 70},
        { field: 'ModelA', headerName: 'Model', width: 90 },
        { field: 'ConceptA', headerName: 'Concept', width: 900},
        {
            field: 'ModelB',
            headerName: 'Model',
            type: 'string',
            width: 90,
        },
        {
            field: 'ConceptB',
            headerName: 'Concept',
            description: 'Concept to match to',
            // sortable: false,
            width: 450,
            // valueGetter: (params) =>
                // `${params.row.firstName || ''} ${params.row.lastName || ''}`,
        },
    ];

    var [rows, setRows] = useState(props.root_reducer.matches);
    console.log(rows)
    console.log(props)

    // #########################################################################
    const processRowUpdate = (newRow) => {
        const updatedRow = { ...newRow, isNew: false };
        setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };


    // Ajouter proposition matchs exacts

    return (
        <div className="create_match_page">


            <div className="page_body">
                <div className="info_div">
                    {/*<Box sx={{ flex:1 }}>*/}
                        <div className="tree_list">




                            <p>Models list</p>
                            <TreeView
                                aria-label="Platforms list"
                                defaultCollapseIcon={<ExpandMoreIcon/>}
                                defaultExpandIcon={<ChevronRightIcon/>}
                                onNodeSelect={(event, nodeIds) => (setConceptA(nodeIds))}
                                sx={{
                                    height: "inherit",
                                    backgroundColor:"white",
                                    overflowY: 'scroll',
                                    boxShadow: "10px 5px 5px rgba(227, 227, 227, .5)",
                                    border: 1,
                                    borderColor: "rgba(227, 227, 227, .5)",

                                    resize:"both"
                                }}
                            >
                                {model_tree.length === 0 ? "" : model_tree}
                                {/*{plat_tree.length === 0 ? "" : plat_tree}*/}
                            </TreeView>
                        </div>
                        <div className="tree_list">
                            <p>Model list</p>
                            <TreeView
                                aria-label="Platforms list"
                                onNodeSelect={(event, nodeIds) => (setConceptB(nodeIds))}
                                defaultCollapseIcon={<ExpandMoreIcon/>}
                                defaultExpandIcon={<ChevronRightIcon/>}
                                sx={{
                                    height: "inherit",
                                    backgroundColor:"white",
                                    overflowY: 'scroll',
                                    overflowX: 'scroll',
                                    boxShadow: "10px 5px 5px rgba(227, 227, 227, .5)",
                                    border: 1,
                                    borderColor: "rgba(227, 227, 227, .5)",
                                    resize:"both",
                                    // maxWidth:"30%"
                                }}
                            >
                                {model_tree.length === 0 ? "" : model_tree}
                            </TreeView>


                        </div>

                    {/*</Box>*/}
                </div>
                <div className="table_div">


                    <div className="table">

                        <DataGrid
                            // className="table"

                            rows={rows}
                            columns={columns}
                            initialState={{
                                pagination: {
                                    paginationModel: { page: 0, pageSize: 7 },
                                },
                            }}
                            pageSizeOptions={[7, 10,100]}
                            checkboxSelection
                            processRowUpdate={processRowUpdate}
                            onRowSelectionModelChange={(ids) => {setSelectedRow(ids);
                            }}

                            components={{
                                NoRowsOverlay: () => (
                                        <Stack height="100%" alignItems="center" justifyContent="center" >
                                            No match
                                        </Stack>
                                    )}}
                        />
                    </div>
                    <div className="header_table">
                        <p>Selection</p>
                        <div className="button_div">
                            <Button variant="outlined" onClick={() => {

                                const aux_A = conceptA.split(".");
                                const aux_B = conceptB.split(".");
                                console.log(conceptA)
                                console.log("TA MERE")
                                console.log(aux_B)
                                if ((aux_A.length >= 3) & (aux_B.length>=3) & ( aux_B[1] === "keys") & ( aux_B[1] === "keys")) {
                                    setId_aux(id_aux+1)
                                    setRows(rows.concat([{
                                        id: id_aux,
                                        ModelA: aux_A[0],
                                        ConceptA: aux_A.slice(2).join("."),
                                        ModelB: aux_B[0],
                                        ConceptB: aux_B.slice(2).join(".")
                                    }]));
                                }
                            }}
                            >Add match</Button>
                            <Button variant="outlined"
                                    onClick={() => {
                                        try{
                                            setRows(rows.filter(obj => !selectedRow.includes(obj.id)));
                                            console.log(selectedRow)
                                        }
                                        catch{
                                        }


                                    }}

                            >Delete selection</Button>
                            <Button variant="outlined"
                                    onClick={ () =>{
                                        // console.log(props.matches);
                                        // localStorage.setItem("matches", rows);
                                        // props.setMatches(rows)
                                        props.dispatch({type:"ADD_MATCHES", matches:rows, id_match:id_aux});
                                        // props.matches = rows;
                                    }

                                    }
                            >Confirm matches (all in the table)</Button>
                            {/*<Button variant="outlined"*/}
                            {/*        onClick={ () =>{*/}
                            {/*            // console.log(props.matches);*/}
                            {/*            // localStorage.setItem("matches", rows);*/}
                            {/*            // props.setMatches(rows)*/}
                            {/*            localStorage.setItem("state",JSON.stringify({"matches":[],"id_match":0}))*/}
                            {/*            // props.matches = rows;*/}
                            {/*        }*/}

                            {/*        }*/}
                            {/*>Reset (DEV)</Button>*/}
                        </div>
                    </div>


                </div>

            </div>
        </div>
    );
}

function mapStateToProps(state) {
    // const { todos } = state
    return state
}

export default connect(mapStateToProps)(CreateMatchPage)