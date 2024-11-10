import React, { useMemo, useCallback, useEffect, useState, useRef } from "react";
import TextField from '@mui/material/TextField';
import SendIcon from '@mui/icons-material/Send';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import PhotoIcon from '@mui/icons-material/Photo';
import { useWebSocket } from './WebSocketContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Talktostrangers() {
    document.title = "Connectify-talk";
    const { socket } = useWebSocket();
    const navigate = useNavigate();
    const location = useLocation();
    const [name, setName] = useState("");
    const [leftname, setleftname] = useState("You");
    const [notLoadedName, setNotLoadedName] = useState(".");
    const [messages, setMessages] = useState([]);
    const [disabled, setDisabled] = useState(true);
    const [inputValue, setInputValue] = useState("");
    const [myname, setmyname] = useState("");
    const [opp_or_I_left, setopp_or_I_left] = useState("");
    const chatAreaRef = useRef(null);
    const [leave_new, set_leave_new] = useState('Leave');
    const [left, setLeft] = useState(false);
    const [recovered, set_recover] = useState(false);
    const [lost_connection, set_lost_connection] = useState(false);
    const [typing, setTyping] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const fileInputRef = useRef(null); // Ref for file input

    const curseWords = useMemo(() => [
        "badword1", "badword2", "ass", "badword3", "fuck", "nigga", "fucker", 
        "asshole", "cunt", "whore", "nigga", "hoe", "Bastard", "Shit", "Bitch", 
        "Dick", "Pussy", "son of a bitch", "Mother Fucker", "bloody", "Cock", 
        "dumb"
    ], []);

    const censorMessage = useCallback((message) => {
        const pattern = new RegExp(curseWords.join("|"), "gi");
        return message.replace(pattern, match => "*".repeat(match.length));
    }, [curseWords]);
    useEffect(() => {
        if (socket) {
            socket.on("got_username", (data) => {
                console.log("got the name");
                setName(data);
            });

            socket.on('message', (data) => {
                const censoredMessage = censorMessage(data);
                const message = {
                    img:false,
                    text: censoredMessage,
                    time: new Date().toLocaleTimeString(),
                    movement: 'left',
                    marginleft: 0,
                    timemargin: 0,
                    marginright: 63,
                    bgcolor: '#c6c7e0'
                };
                setMessages(prevMessages => [...prevMessages, message]);
            });
            socket.on("img",(img)=>{
                const blob = new Blob([img], { type: 'image/jpeg' });
                const message = {
                    img:true,
                    height:"10%",
                    width:"20%",
                    text: URL.createObjectURL(blob),
                    time: new Date().toLocaleTimeString(),
                    movement: 'left',
                    marginleft: 0,
                    timemargin: 0,
                    marginright: 63,
                    bgcolor: '#c6c7e0'
                };
                setMessages(prevMessages => [...prevMessages, message]);
            })
            socket.on("left", (username) => {
                console.log("i left");
                setLeft(true);
                setDisabled(true);
                setleftname(username);
                set_leave_new('New');
                if (chatAreaRef.current) {
                    chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
                }
            });

            socket.on("my_username", (myname) => {
                setmyname(myname);
            });

            socket.on("recovered", () => {
                set_lost_connection(false);
                set_recover(true);
            });

            socket.on("typing", () => {
                setIsTyping(true);
            });

            socket.on("stop typing", () => {
                setIsTyping(false);
            });

            socket.on("lost_conn", (data) => {
                set_lost_connection(true);
                setopp_or_I_left(data);
            });
            // Cleanup on component unmount
            return () => {
                socket.on("Left");
                socket.off("got_username");
                socket.off("message");
                socket.off("my_username");
                socket.off("recovered");
                socket.off("typing");
                socket.off("stop typing");
                socket.off("lost_conn");
                socket.off("img");
            };
        }
    }, [socket, censorMessage,navigate, location]);

    const handleClick = async () => {
        if (inputValue.length !== 0 && name.length !== 0) {
            const censoredMessage = censorMessage(inputValue);
            const data = {
                img : false,
                text: censoredMessage,
                time: new Date().toLocaleTimeString(),
                marginleft: 63,
                movement: 'right',
                timemargin: 92,
                bgcolor: 'white',
                marginright: 0
            };
            setMessages(prevMessages => [...prevMessages, data]);
            setInputValue("");
            if (chatAreaRef.current) {
                chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
            }
            socket.emit("message", censoredMessage);
            socket.emit("stop typing", { username: name });
            setTyping(false);
        }
    };

    useEffect(() => {
        if (name.length !== 0) {
            setDisabled(false);
            setMessages([{
                text: "Start Typing . . . .",
                time: new Date().toLocaleTimeString(),
                color: "white"
            }]);
        } else {
            const interval = setInterval(() => {
                setNotLoadedName(prev => prev.length <= 4 ? prev + ' .' : ' .');
            }, 2000);

            return () => clearInterval(interval);
        }
    }, [name]);

    const typingHandler = (e) => {
        setInputValue(e.target.value);
        if (!socket) return;
        if (!typing) {
            setTyping(true);
            socket.emit("typing");
        }
        let lastTypingTime = new Date().getTime();
        var timerLength = 3000;
        setTimeout(() => {
            var timeNow = new Date().getTime();
            var timeDiff = timeNow - lastTypingTime;
            if (timeDiff >= timerLength && typing) {
                socket.emit("stop typing");
                setTyping(false);
            }
        }, timerLength);
    };

    const handleLeft = () => {
        if (!left) {
            set_leave_new('New');
            socket.emit("Left");
            setLeft(true);
            setDisabled(true);
            if (chatAreaRef.current) {
                chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
            }
        } else {
            set_leave_new('Leave');
            setLeft(false);
            setDisabled(true);
            setName("");
            setMessages([]);
            socket.emit("username", myname);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleClick();
        } else if (e.keyCode === 27) {
            handleLeft();
        }
    };

    const handleIconClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click(); // Trigger the hidden file input click
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const message = {
                img:true,
                height:"10%",
                width:"20%",
                text: URL.createObjectURL(file),
                time: new Date().toLocaleTimeString(),
                marginleft: 63,
                movement: 'right',
                timemargin: 92,
                bgcolor: 'white',
                marginright: 0
            };
            setMessages(prevMessages => [...prevMessages, message]);
             socket.emit('images', file);
            
            if (chatAreaRef.current) {
                chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
            }
            // Handle the file upload here (e.g., send the file to the server)
        }
    };
    const handleissue = ()=>{
        
    }
    return (
        <div>
            <Button onClick = {handleissue} style={{marginLeft:"47%", marginTop:"2%", marginBottom:"-3%"}} className="btn btn-danger">Report User</Button>
            <div className="card" style={{ backgroundColor: "black", marginTop: "5%", marginLeft: "5%", marginRight: "5%", marginBottom: "5%", height: "600px", border: "1px solid white", borderRadius: "10px" }}>
                <div className="card-header element" style={{ height: "60px", border: "1px solid white", borderRadius: "10px" }}>
                    <h3 style={{ color: "white", textAlign: "center" }}>You Connectedtify To {name.length === 0 ? notLoadedName : name}</h3>
                </div>
                <div className="card-body" style={{ flexDirection: "column", flex: "1", overflowY: "auto", display: "flex" }} ref={chatAreaRef}>
                    {messages.map((message, index) => (
                        <div key={index} style={{ marginBottom: "20px" }}>
                            {!message.img && (
                                <div style={{
                                    color: `${message.color}`,
                                    backgroundColor: `${message.bgcolor}`,
                                    float: `${message.movement}`,
                                    marginLeft: `${message.marginleft}%`,
                                    marginRight: `${message.marginright}%`,
                                    width: `${message.text.length - message.text.length - 1 < 8 ? message.text.length - message.text.length - 1 * 35.7142857143 : 400}px`,
                                    padding: "10px",
                                    height: `${((message.text.length / 9) - (message.text.length - 1)) * 35}px`,
                                    border: "2px solid white",
                                    borderRadius: "30px",
                                    textAlign: "left"
                                }}>{message.text}</div>
                            )}
                            {
                                message.img && (
                                    <div>
                                        <img style={{float: `${message.movement}`,
                                    marginLeft: `${message.marginleft}%`,
                                    marginRight: `${message.marginright}%`,}}height={message.height} width={message.width} src={message.text} alt="CANNOT DISPLAY"/>
                                    </div>
                                )
                            }
                            <div style={{ marginBottom: "20px", marginLeft: `${message.timemargin}%`, marginRight: `${message.marginright}%` }} className="text-muted">{message.time}</div>
                        </div>
                    ))}
                    {left && (
                        <div>
                            <hr style={{ border: "1px solid white" }} />
                            <strong><h3 style={{ textAlign: "center", color: "white" }}>{leftname} Left</h3></strong>
                        </div>
                    )}
                    {
                        lost_connection && <Alert variant="outlined" severity="info" sx={{ fontWeight: "bold" }}>
                            {opp_or_I_left}
                        </Alert>
                    }
                    {
                        recovered && <Alert variant="outlined" severity="success">
                            Connection Restored.
                        </Alert>
                    }
                    {isTyping && (
                        <div style={{ color: "white", float: "left" }}>Typing...</div>
                    )}
                </div>
                <div className="card-footer" style={{ marginBottom: "1%", border: "1px solid white", borderRadius: "10px" }}>
                    <TextField
                        sx={{ input: { color: 'white' } }} color="secondary" focused
                        required
                        value={inputValue}
                        onChange={(e) => {
                            typingHandler(e); // Call typingHandler when input changes
                            setInputValue(e.target.value);
                        }}
                        onKeyDown={handleKeyDown}
                        fullWidth
                        disabled={disabled}
                        id="standard-basic"
                        label="Type here"
                        variant="standard"
                        InputProps={{
                            endAdornment: (
                                <React.Fragment>
                                    <div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                    />
                                    
                                    <PhotoIcon 
                                        onClick={handleIconClick} 
                                        style={{ cursor: 'pointer', color: 'white', marginRight: '20px' }}
                                    />
                                    </div>
                                    <Button onClick={handleLeft} color="error" sx={{ marginRight: "20px", marginBottom: "10px" }} size="small" variant="contained">{leave_new}</Button>
                                    <Button onClick={handleClick} sx={{ marginBottom: "10px" }} size="small" variant="contained" endIcon={<SendIcon />}>Send</Button>
                                </React.Fragment>
                            )
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
