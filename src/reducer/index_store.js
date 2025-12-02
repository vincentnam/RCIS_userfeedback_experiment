import {combineReducers} from 'redux';

import {rootReducer} from "./rootReducer";

// Defaultly exported as rootReducer
// Aggregate all the reducer for the root store


// To use the reducer :

//1. Change the export to
//const mapStateToProps = (state) => {
//   console.log(state)
//   const reducer = state.home_screen_reducer
//   return reducer
// }
//
//
// export default connect(mapStateToProps)(MarketCard)
//
// Props will be augmented with home_screen_reducer and dispatch() function
//2. Then :
// props.dispatch({
//           type: action_types_home_screen.add_market,
//           payload:{
//             path:"test",
//             market:{
//               name: "La croquette bio",
//               contentText: "La croquette bio",
//               distance: '2,7',
//               stars: '* * *',
//               temps: '30',
//               image:require('../assets/images/MarketCard_3.png')
//             }
//           }
//         });


// May be useful for login or temporary function: https://redux.js.org/recipes/code-splitting
export default combineReducers({
    root_reducer: rootReducer ,
})