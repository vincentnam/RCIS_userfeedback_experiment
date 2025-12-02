import './register_platform.css';
import {Form, Input, Button, Cascader} from 'antd';
import {connect} from "react-redux";
import {React, useEffect, useState} from 'react';
import get_mandatory_platform_to_connect_to from "../tools/get_mandatory_platform";


function RegisterPlatformPage(props) {
    const [modelComponentDisabled, setModelComponentDisabled] = useState(true);
    const [mandatory_platform, setMandatoryPlatform]= useState([]);
    const [platformData, setPlatformData] = useState({platform_name:"",platform_URL:"",mandatory_platform_to_connect_to:[],platform_to_connect_to:[], model_cascader:[], id_platform:""});
    console.log(props)

    var options = [];
    var model_options = [];
    useEffect(() => {
        const dataFetch = async () => {
            const data = await (get_mandatory_platform_to_connect_to(localStorage.getItem("PlatformURL")));
            setMandatoryPlatform(data);
                    };
        dataFetch();
    }, []);




    if (props.context?.platforms){
        options = Object.keys(props.context.platforms).filter((el)=> !(mandatory_platform?.includes(el)) ).map((key) => {
            return {label: props.context?.platforms[key]?.name, value: key}
        });
    }
    if (props.context?.models){
        model_options = Object.keys(props.context.models).map((key) => {
            return {label: props.context?.models[key]?.name, value:key}
        });
        model_options.unshift({label:"New model (see 'Register model page')", value:"Custom model"})
    }

    const mandatory_options = mandatory_platform?.map((key, index)=>{
        return {label: props.context?.platforms[key]?.name, value: key}
    });

    const onValueChangeForm = (value, allvalues)=>{

        setPlatformData({...platformData,...allvalues});

    }
    console.log(props)
    return (

        <div className="register_platform">
            <div className="form_platform_header">
                <p>
                    Fill platform information for registration in OSDN
                </p>

            </div>
            <div className="form_platform">
                <div>


                </div>
                <Form
                    name="basic"
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    style={{ maxWidth: 600 }}
                    initialValues={{ remember: true }}

                    autoComplete="off"
                    onValuesChange={onValueChangeForm}
                >
                    <Form.Item
                        label="Platform name"
                        name="platform_name"
                        rules={[{ required: true, message: 'Platform name needed.' }]}
                    >
                        <Input placeholder="Example : RCSB PDB,  data.gouv.fr, ..."/>
                    </Form.Item>

                    <Form.Item
                        label="Platform URL "
                        name="platform_URL"
                        rules={[{ required: true, message: 'URL to message the platform needed.' }]}
                        initialValue={props.config.URL}
                    >
                        <Input placeholder='Examples : www.platform.com/osdn_api, 192.168.0.1:5000..'/>
                    </Form.Item>
                    <Form.Item
                        label="Mandatory platform"
                        name="mandatory_platform_to_connect_to"

                        rules={[{ required: true, message: 'Select a platform to connect to.' }]}
                    >
                        <Cascader
                            options={mandatory_options}
                            multiple
                            maxTagCount="responsive"

                            // expandTrigger="hover"
                            // displayRender={displayRender}
                            // onChange={onChange}
                        />

                    </Form.Item>
                    <Form.Item
                        label="Platform to connect to"
                        name="platform_to_connect_to"

                        rules={[{  required: true, message: 'Select a platform to connect to.' }]}
                    >
                        <Cascader
                            options={options}
                            multiple
                            maxTagCount="responsive"

                            // expandTrigger="hover"
                            // displayRender={displayRender}
                            // onChange={onChange}
                        />

                    </Form.Item>
                    {/*<div style={{width:"100%", display: "flex", justifyContent:"center" }}>*/}
                    {/*    <p style={{marginRight:"1rem"}}>Use model in the list</p>*/}
                    {/*    <Checkbox*/}
                    {/*        checked={modelComponentDisabled}*/}
                    {/*        onChange={(e) => setModelComponentDisabled(e.target.checked)}*/}
                    {/*    />*/}

                    {/*</div>*/}
                    <Form.Item
                        label="Model used"
                        name="model_cascader"
                        className="model_checkbox_div"
                        rules={[{ required: true, message: 'URL to message the platform needed.' }]}
                    >


                            <Cascader
                                className="model_used"
                                name="model_cascader"
                                label="model_cascader"
                                title="See model register page to define the custom model"
                                placeholder="See model register page for model not in the registry"
                                options={model_options}
                                multiple
                                maxTagCount="responsive"
                                disabled={!modelComponentDisabled}
                            />



                    </Form.Item>
                    <Form.Item
                        label="Platform ID in registry"
                        name="id_cascader"
                        className="ID_checkbox_div"
                        rules={[{ required: true, message: 'Platform ID of the platform' }]}
                        initialValue={props.config.ID_PLATFORM}
                    >


                        <Input placeholder='Examples : www.platform.com/osdn_api, 192.168.0.1:5000..' />


                    </Form.Item>

                    <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                        <Button type="primary" onClick={(el)=> props.dispatch({type:"ADD_PLATFORM",platform:platformData})}>
                            Confirm informations
                        </Button>
                        {/*<Button type="primary" onClick={()=> console.log(platformData)}>*/}
                        {/*    Log props*/}
                        {/*</Button>*/}
                    </Form.Item>
                </Form>
            </div>


        </div>
    );
}

function mapStateToProps(state) {
    return state
}

export default connect(mapStateToProps)(RegisterPlatformPage)