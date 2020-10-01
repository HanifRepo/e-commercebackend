var express = require('express');
var router = express.Router();
var { PrismaClient } = require('@prisma/client')

var prisma = new PrismaClient();


router.get('/genetarelink',async function(req,res,next){//GENERATING LINk
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

router.post('/acceptUser',async function(req,res,next){//ACCEPTING SELLER
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

router.post('/blockaccount',async function(req,res,next){
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



module.exports = router;