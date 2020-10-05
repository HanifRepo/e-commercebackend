var express = require('express');
var router = express.Router();
var { PrismaClient } = require('@prisma/client')

var prisma = new PrismaClient();


router.get('/genetarelink',autenticateToken,async function(req,res,next){//GENERATING LINk
    res.setHeader('Content-Type', 'application/json');
    //NEED TO ADD ADMIN VERIFICATION
    var token;
    var checkToken;
    do{    
        require('crypto').randomBytes(48, function(err, buffer) {
            token = buffer.toString('hex');
        });
        checkToken = await prisma.invitelink.findFirst({
            where:{
                token: token
            }
        });
    } while(checkToken !== null);
    
    const addToken = await prisma.invitelink.create({
        data:{
            token: token,
            status: "open"
        }
    });

    if(addToken !== null){
        res.send({ "token": token})
    }else {
        res.send({"token":null})
    }
});

router.post('/acceptUser',autenticateToken ,async function(req,res,next){//ACCEPTING SELLER
    res.setHeader('Content-Type', 'application/json');
    //NEED TO ADD ADMIN VERIFICATION
    username = req.body.username;
    status = req.body.status;
    admin = req.body.admin;
    const getAdminId = await prisma.user.findFirst({
        where:{
            username: username
        }
    })
    if(getAdminId !== null){
        const getSeller = await prisma.user.findFirst({
            where:{
                username: req.body.username
            }
        });
        if(getSeller !== null){
            const userStatus = await prisma.userstatus.findFirst({
                where:{
                    userid : getSeller.id
                }
            })
            const updateUserStatus = await prisma.userstatus.update({
                where:{
                    id: userStatus.id
                },
                data:{
                    status : "accept",
                    adminid: admin
                }
            });
            if(updateUserStatus !== null){
                return res.send({status: "accepted"})
            }
        } else{
            return res.send({status: "rejected"})
        }
    } else{
        return res.send({status: "rejected"})
    }
});

router.post('/blockaccount',autenticateToken,async function(req,res,next){
    var username = req.body.username;
    var blockUser = await prisma.user.updateMany({
        where:{
            username: username
        },
        data:{
            status: "blocked"
        }
    }); 
    if(blockUser.length !== 0){
        return res.send({blocked: "success"});
    }else{
        return res.send({blocked: "failed"});
    }
});

async function autenticateToken(req,res,next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(token === null) return res.sendStaus(401);
  
    jwt.verify(token,process.env.SECRET_KEY,(err,name) =>{
      if(err) return res.sendStaus(403);
      req.answer = name;
    })
    const verifyUser = await prisma.user.findFirst({
        where : {
          username: req.answer.username
        }
    });
    if(verifyUser !== null && verifyUser.password === req.answer.password && verifyUser.status === "open"){
        next();
    } else{
        res.sendStaus(401);
    }
}


module.exports = router;