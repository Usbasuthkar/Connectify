const { Server } = require('socket.io');
const io = new Server(process.env.PORT,{
    cors:{
        origin:'*',
        methods:['GET','POST']
    }
});
let count = 0;
let flag = 0;
const clients = new Map();
const ready_to_connect = new Map(); 
const paired = new Map();
const curseWords = ["badword1","ass", "badword2", "badword3","fuck","nigga","fucker","asshole","cunt","whore","nigga","hoe","Bastard","Shit","Bitch","Dick","Pussy","son of a bitch","Mother Fucker","bloody","Cock","dumb"];

function censorMessage(message) {
    // Constructing a regular expression pattern from the curseWords array
    const pattern = new RegExp(curseWords.join("|"), "gi");
    // Replace any occurrence of curse words with asterisks of the same length
    return message.replace(pattern, match => "*".repeat(match.length));
}
io.on("connection",(socket)=>{
    console.log("got a client");
    socket.on("username",(data)=>{
        flag = 1
        console.log("got called");
        socket.emit("my_username",data);
        clients.set(socket,data);
        ready_to_connect.set(socket,true);
        parent = [];
        setTimeout(()=>{
            console.log("i am finding ");
            const condition = (client) => client !== socket && !paired.has(client) && ready_to_connect.get(client)===true;
            partners = Array.from(clients).filter(([key, value]) => condition(key)).map(([key, value]) => key);
            if(paired.has(socket)){
                const x = "";
            }
            else if(partners.length === 0){
                socket.emit("got_username","NO ONE CAUSE NOT ENOUGH CLIENTS ARE PRESENT DO NOT PRESS ANYTHING WAIT FOR SOME TIME");
            }else{
            const partner_index = Math.floor(Math.random() * partners.length);
            const partner = partners[partner_index];
            if(!paired.has(partner) && !paired.has(socket)){
                console.log("got a parnter");
                paired.set(socket,partner);
                paired.set(partner,socket);
                partner.emit("got_username",data);
                socket.emit("got_username",clients.get(partner));
            }
            }

        },10000);
    });
    socket.on('message',(message)=>{
        if(paired.has(socket)){
            const censoredMessage = censorMessage(message);
            paired.get(socket).emit("message",message);
        }
    })
    setInterval(()=>{
        socket.emit("count",clients.size);
    },1000);
    socket.on("Left",()=>{
            const opp_client = paired.get(socket);
            const name = clients.get(socket);
            ready_to_connect.set(socket,false);
            ready_to_connect.set(opp_client,false);
            paired.delete(socket);
            console.log(paired.size);
            paired.delete(opp_client);
            console.log(paired.size);
            opp_client.emit("left",name);
    })
    socket.on("typing",()=>{
        const opp_client = paired.get(socket);
        opp_client.emit("typing");
    });
    socket.on("stop typing",()=>{
        const opp_client = paired.get(socket);
        opp_client.emit("stop typing");
    });
    socket.on("disconnect",()=>{
        if(flag == 1){
            const opp_client = paired.get(socket);
            const name = clients.get(socket);
            clients.delete(socket);
            paired.delete(socket);
            paired.delete(opp_client);
            opp_client.emit("left",name);
        }
    })
    socket.on("chatrooms",(name)=>{
        socket.emit("get_name",name);
    })
    socket.on("rooms",(channel)=>{
        socket.join(channel.id)
        socket.to(channel.id).emit("joined", channel.name + " joined");
        console.log(`joined ${channel}  ${channel.name}`);
    })
    socket.on("room_messages",(data)=>{
        console.log(data);
        socket.to(data.room).emit("messages_of_room",{name:data.name,message:data});
    })
    socket.on("left_room",(data)=>{
        socket.leave()
    })
})
