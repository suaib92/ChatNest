import axios from "axios";
import {UserContextProvider} from "./components/UserContext";
import Routes from "./components/Routes";

function App() {
  axios.defaults.baseURL = 'https://chatnest-5676.onrender.com';
  axios.defaults.withCredentials =  true;
  return (
    <UserContextProvider>
      <Routes />
    </UserContextProvider>
  )
}

export default App
