const { Server } = require('socket.io');
const io = new Server(5000,{
    cors:{
        origin:'*',
        methods:['GET','POST']
    }
});
let count = 0;
const clients = new Map();
const paired = new Map();
io.on("connection",(socket)=>{
    console.log("got a client");
    socket.on("username",(data)=>{
        console.log("got called");
        socket.emit("my_username",data);
        clients.set(socket,data);
        parent = [];
        setTimeout(()=>{
            console.log("i am finding ");
            const condition = (client) => client !== socket && !paired.has(client);
            partners = Array.from(clients).filter(([key, value]) => condition(key)).map(([key, value]) => key);
            if(paired.has(socket)){
                const x = "";
            }
            else if(partners.length === 0){
                socket.emit("got_username","NO ONE CAUSE NOT ENOUGH CLIENTS ARE PRESENT");
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
            paired.get(socket).emit("message",message);
        }
    })
    setInterval(()=>{
        socket.emit("count",clients.size);
    },1000);
    socket.on("Left",()=>{
        const opp_client = paired.get(socket);
        const name = clients.get(socket);
        paired.delete(socket);
        console.log(paired.size);
        paired.delete(opp_client);
        console.log(paired.size);
        opp_client.emit("left",name);
    })
    socket.on("disconnect",()=>{
        const opp_client = paired.get(socket);
        const name = clients.get(socket);
        clients.delete(socket);
        paired.delete(socket);
        paired.delete(opp_client);
        opp_client.emit("left",name);
    })
})