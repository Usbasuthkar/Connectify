import React,{useEffect, useState} from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import SendIcon from '@mui/icons-material/Send';
import { Button } from "@mui/material";
import Alert from '@mui/material/Alert';
import { useWebSocket } from './WebSocketContext';
export default function Rooms(){
    const [input,set_intput] = useState('');
    const [room_name,set_room_name] = useState('');
    const { socket } = useWebSocket();
    const [already_joined,set_already_joined] = useState(false);
    const [selected,setselected] = useState(false);
    const [name,setname] = useState("");
    const [messages,setMessages] = useState([]);
    const [people,setpeople] = useState([{name:"YOU JOINED",color:"red"}]);
    const [joined,setjoined] = useState(false);
    const [got_message,set_got_message] = useState(false);
    useEffect(()=>{
        socket.on("get_name",(data)=>{
            setname(data);          
        })
        socket.on("joined",(text)=>{
            setjoined(true);
            set_got_message(false);
            setpeople([...people,{name:text,color:"white"}]);
        })
        socket.on("messages_of_room",(data)=>{
            console.log(data.message.data);
            set_got_message(true);
            const message = {name:data.name+':',text:data.message.data, time:new Date().toLocaleTimeString(),
                movement:'left',
                marginleft: 0,
                timemargin:0,
                marginright : 90,
                bgcolor:'#c6c7e0'
            }
            setMessages([...messages,message]);
        })
    },[socket,messages,name,joined,got_message,people]);
    const handlechannels = (e)=>{
        if(selected === false){
            setselected(false);
            setjoined(true);
            set_room_name(e.target.id);
            setTimeout(()=>{
                setselected(true);
                socket.emit("rooms",{id:e.target.id,name:name});
            },100);
        }
        else{
            set_already_joined(true);
        }
    }
    const handlesend = ()=>{
        const message = document.getElementById("standard-basic").value;
        set_got_message(true);
        set_intput('');
        socket.emit("room_messages",{room:room_name,data:message,name:name});
        const data = {name:'You:', text: message, time: new Date().toLocaleTimeString(),
            marginleft:63,
            movement:'right',
            timemargin:90   ,
            bgcolor:'white',
            marginright:0
            }
        setMessages([...messages,data]);
    }
    const handleleave = ()=>{
        setselected(false);
        setMessages([]);
        setpeople([{name:"YOU JOINED",color:"red"}]);
        set_already_joined(false);
        socket.emit("left_room",{name,});
    }
    return(
        <div className="card" style={{"marginTop":"5%","border":"1px solid white","margin":"10px","backgroundColor":'black',"height":"700px"}}>
            <div className="card-header element" style={{ height: "60px",border:"1px solid white",borderRadius: "10px" }}>
                    <h3 style={{ color:"white",textAlign: "center" }}>You are {name}</h3>
                </div>
            <div className="card-body conatiner">
                <div className="row">
                    <div className="col-3" style={{"borderRight":"1px solid white","height":"650px"}}>
                    <Box sx={{ width: '100%',"marginTop":"10%" }}>
                        <Stack spacing={1}>
                            <Button id="channel1" onClick={handlechannels} sx={{backgroundColor: "black",borderTop:"1px solid grey",borderBottom:"1px solid grey",padding: "10px",textAlign: 'center',color: 'white',}}>Channel 1</Button>
                            <Button id="channel2" onClick={handlechannels} sx={{backgroundColor: "black",borderTop:"1px solid grey",borderBottom:"1px solid grey",padding: "10px",textAlign: 'center',color: 'white',}}>Channel 2</Button>
                            <Button id="channel3" onClick={handlechannels} sx={{backgroundColor: "black",borderTop:"1px solid grey",borderBottom:"1px solid grey",padding: "10px",textAlign: 'center',color: 'white',}}>Channel 3</Button>
                        </Stack>
                    </Box>
                    </div>
                    <div className="col-8">
                    <div className="card" style={{ backgroundColor:"black", border: "1px solid white","width":"112%",borderRadius: "10px","height":"650px" }}>
                    
                {
                    selected && <>
                    <div className="card-header element" style={{ height: "60px",border:"1px solid white",borderRadius: "10px" }}>
                    <h3 style={{ color:"white",textAlign: "center" }}>You are in Room1</h3>
                    {already_joined && <Alert severity="error">LEAVE THE ROOM IN ORDER TO GET OUT</Alert>}
                </div>
                    <div className="card-body" style={{ flexDirection: "column", flex: "1", overflowY: "auto", display: "flex" }}>
                    {
                        joined && people.map((person,index)=>(
                            <center key={index}><strong style={{color:person.color}}>---{person.name}---</strong></center>
                        ))
                    }{
                        got_message && messages.map((message, index) => (
                            <div key={index} style={{marginBottom: "20px" }}>
                                { message.text && (
                                    <div>
                                    <div style={{ color:`${message.color}`, backgroundColor:`${message.bgcolor}`,float:`${message.movement}`,marginLeft: `${message.marginleft}%`,marginRight:`${message.marginright}%` ,width: `${message.text.length - message.text.length-1 < 8?message.text.length - message.text.length-1*35.7142857143: 400}px`, padding: "10px", height: `${((message.text.length/9) - (message.text.length-1))*35}px`, border: "2px solid white", borderRadius: "30px", textAlign: "left" }}><strong><div>{message.name}</div></strong>{message.text}</div>
                                    </div>
                                )}
                                <div style={{ marginBottom: "20px", marginLeft: `${message.timemargin}%`,marginRight:`${message.marginright}px` }} className="text-muted">{message.time}</div>
                            </div>
                        ))
                    }
                    </div>
                    <div className="card-footer" style={{border:"1px solid white",borderRadius: "10px" }}>
                        <TextField
                        sx={{input: { color: 'white' }}} color="secondary" focused
                            required
                            fullWidth
                            onChange={(e)=>{set_intput(e.target.value)}}
                            value={input}
                            id="standard-basic"
                            label="Type here"
                            variant="standard"
                            InputProps={{
                                endAdornment: (
                                    <React.Fragment>
                                        <Button onClick={handleleave} color="error" sx={{ marginRight: "20px", marginBottom: "10px" }} size="small" variant="contained">Leave</Button>
                                        <Button onClick={handlesend}sx={{ marginBottom: "10px" }} size="small" variant="contained" endIcon={<SendIcon />}>Send</Button>
                                    </React.Fragment>
                                )
                            }}
                        />
                    </div>
                    </>
                }
            </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
