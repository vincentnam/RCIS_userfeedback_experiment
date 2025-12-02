import './create_model.css';
import {connect} from "react-redux";
import {Button, Upload} from "antd";
import {useEffect, useState} from "react";
import sortBy from 'lodash/sortBy';
import { DataTable } from 'mantine-datatable';

function CreateModelPage(props) {
    const [modelName, setModelName]= useState(localStorage.getItem("modelName")?localStorage.getItem("modelName"):"");
    const [fileList, setFileList] = useState([]);
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
    const [sortStatus, setSortStatus] = useState({ columnAccessor: 'name', direction: 'asc' });
    useEffect(() => {
        const data = sortBy(dataFile, sortStatus.columnAccessor);

        setDataFile(sortStatus.direction === 'desc' ? data.reverse() : data);
    }, [sortStatus]);


    function CSVToArray( strData, strDelimiter ){
        // Imported function from @luishdez
        // See : https://gist.github.com/luishdez/644215
        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");

        // Create a regular expression to parse the CSV values.
        var objPattern = new RegExp(
            (
                // Delimiters.
                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                // Standard fields.
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi"
        );


        // Create an array to hold our data. Give the array
        // a default empty first row.
        var arrData = [[]];

        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null;


        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec( strData )){

            // Get the delimiter that was found.
            var strMatchedDelimiter = arrMatches[ 1 ];

            // Check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if (
                strMatchedDelimiter.length &&
                strMatchedDelimiter !== strDelimiter
            ){

                // Since we have reached a new row of data,
                // add an empty row to our data array.
                arrData.push( [] );

            }

            var strMatchedValue;

            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            if (arrMatches[ 2 ]){

                // We found a quoted value. When we capture
                // this value, unescape any double quotes.
                strMatchedValue = arrMatches[ 2 ].replace(
                    new RegExp( "\"\"", "g" ),
                    "\""
                );
            } else {

                // We found a non-quoted value.
                strMatchedValue = arrMatches[ 3 ];

            }

            // Now that we have our value string, let's add
            // it to the data array.
            arrData[ arrData.length - 1 ].push( strMatchedValue );
        }

        // Return the parsed data.
        return( arrData );
    }


    const  upload_props = {
        name: 'file',
        // multiple: false,
        onRemove: (file) => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: async(file) => {
            setFileList([ file]);

            // 1. create url from the file
            const fileUrl = URL.createObjectURL(file);

            // 2. use fetch API to read the file
            const response = await fetch(fileUrl).then(e => e);

            // 3. get the text from the response
            const text = await response.text();
            const csv_file = CSVToArray(text,",");

            const auxColumns=csv_file.shift();

            const object_data = [];

            csv_file.forEach(function (value, i) {
                var auxdict = {"id":i};
                value.forEach(function (arrayContent, index){
                    auxdict[auxColumns[index]] = arrayContent;
                })
                object_data.push(auxdict);

            })

            setDataFile(object_data);



            return false;
        },
        fileList,
    };

    return (
        <div className="create_model_page">
            <div className="upload_section">
                <div className="upload_div_separator">
                    <Upload  {...upload_props }
                             className="dragdrop_component"
                             accept=".csv"
                    >
                        <Button>Click to Upload</Button>
                    </Upload>

                </div>
                <div className="upload_div_separator">
                    <input placeholder="Model name" defaultValue={modelName} onChange={e =>
                    {
                        setModelName(e.target.value);
                    }

                    }/>
                    <Button onClick={
                        (el)=>
                        {
                            console.log(el);
                            console.log(props)
                            localStorage.setItem("modelName", modelName)
                            props.dispatch({type:"ADD_MODEL", model:dataFile, modelName:modelName, modelID:props.config["ID_MODEL"]})
                        }
                    }
                    >Confirm model</Button>

                    <Button onClick={
                        (el)=>
                        {
                            setDataFile([])
                            setFileList([])
                            props.dispatch({type:"ADD_MODEL", model:dataFile})
                        }
                    }
                    >Delete model</Button>
                </div>
            </div>
            <div className="model_view_div" >


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

        </div>
    );
}

function mapStateToProps(state) {
    return state
}

export default connect(mapStateToProps)(CreateModelPage)