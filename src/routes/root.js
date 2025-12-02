import './root.css';
import {connect} from "react-redux";

function RootPage(props) {
    return (
            <div className="root_page">
                <div className="page_body">
                </div>
            </div>
    );
}

function mapStateToProps(state) {
    return state
}

export default connect(mapStateToProps)(RootPage)