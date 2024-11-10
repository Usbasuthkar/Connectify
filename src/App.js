import './App.css';
import Navbar from './Navbar';
import Login from './Login';
import Talktostrangers from './Talktostrangers';
import Rooms from './Rooms';
import {WebSocketProvider} from './WebSocketContext'
import {
  BrowserRouter, Routes, Route,
} from "react-router-dom";
function App() {
  return (
    <WebSocketProvider>
    <BrowserRouter>
    <Navbar/>
      <Routes>
      <Route path="/" element = {<Login/>}></Route>
      <Route path='/talk' element = {<Talktostrangers/>}></Route>
      <Route path='/rooms' element={<Rooms/>}></Route>
      </Routes>
    </BrowserRouter>
    </WebSocketProvider>
  );
}

export default App;
