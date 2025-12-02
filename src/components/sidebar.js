import "./sidebar.css"
import {useState} from "react";






export default function Sidebar(props) {
    const [InputURL, setInputURL] = useState(localStorage.getItem("PlatformURL")!==null?localStorage.getItem("PlatformURL"):"");
    console.log(props)

    return(

        <div className="sidebar_root">
            <div className="sidebar_header">
                <p>Features </p>
                <input defaultValue={InputURL} onChange={e => setInputURL(e.target.value)} placeholder={props.PlatformURL===""?props.PlatformURL:"Platform URL"}/>
                <button onClick={()=>{
                    props.setPlatformURL(InputURL);
                    localStorage.setItem("PlatformURL", InputURL);
                }}
                >
                    Confirm
                </button>
                {/*<div className="button" onClick={props.close_sidebar(true)}>*/}
                {/*    <p >✕</p>*/}
                {/*</div>*/}

            </div>
            <div className="sidebar_body">
                <nav>
                     <ul>
                         <p>Register</p>
                         <li>
                             <a  href={`/register_platform`}>Register a platform</a>
                         </li>
                         <li>
                             <a  href={`/register_model`}>Register a model</a>
                         </li>
                         <li>
                             <a  href={`/create_matches`}>Create matches</a>
                         </li>
                         <li>
                             <a  href={`/confirm_informations`}>Confirm registration</a>
                         </li>
                         <p>Registry visualization</p>
                         <li className="disabled">
                             <a  className="disabled" >Browse platforms</a>
                         </li>
                         <li className="disabled">
                             <a className="disabled" aria-disabled="true">Browse models and matches</a>
                         </li>
                         <p>Information research</p>
                         <li>
                             <a  href={`/research_data`}>Research datasets in OSDN</a>
                         </li>




                     </ul>
                </nav>
            </div>
            <div className="sidebar_footer">
                Open Science Data Network - OSDN
            </div>
        </div>



)


}

