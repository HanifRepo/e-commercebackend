var express = require('express');
var router = express.Router();
var { PrismaClient } = require('@prisma/client')

var prisma = new PrismaClient();

/* GET home page. */
router.route('/:token')
    .get(async function(req, res, next) {//Openeing the generated Link {Link Foemat {http://localhost:3000/invitelink/XXXXYYYY}}
        res.render('login', { title: 'Login', token: req.params.token });
    })
    .post(async function(req, res, next) {//Handling the link
        var tokene = req.body.token;
        const checkToken = await prisma.invitelink.findFirst({
            where: {
                token: tokene
            }
        })
        var tokenDate = new Date(checkToken.timestamp).toISOString().slice(0, 19).replace('T', ' ');
        var nowDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
        tokenDate = tokenDate.replace(' ','-');
        tokenDate = tokenDate.replace(':','-');
        tokenDate = tokenDate.replace(':','-');
        nowDate = nowDate.replace(' ','-');
        nowDate = nowDate.replace(':','-');
        nowDate = nowDate.replace(':','-');
        var splitTokenDate = tokenDate.split('-');
        var splitNowDate = nowDate.split('-');
        var checkTimeStamp = true;
        for(let i=0;i<6;i++){
            if(i<3){
                if(splitTokenDate[i] !== splitNowDate[i]){
                    checkTimeStamp = false;
                    break;
                }
            }
            if(i === 4){
                //Valid only for 30 minutes
                if(Math.abs(parseInt(splitTokenDate[i], 10) - parseInt(splitNowDate[i], 10))>30){
                    checkTimeStamp = false;
                    break;
                }
            }
        }
        if(checkToken !== null && checkToken.status === "open" && checkTimeStamp){
            const verifyUser = await prisma.user.findFirst({
                where : {
                  username: req.body.username
                }
              });
            if(verifyUser !== null){
                return res.send({registration:"failed",error:"Already UserName Used"})
            } else{
                const getRole = await prisma.roles.findFirst({
                    where : {
                      role: "admin"
                    }
                });
                const insertUser = await prisma.user.create({
                    data: {
                      username: req.body.username,
                      password: req.body.password,
                      roleid: getRole.id,
                      status: "open"
                    }
                });
                const updateTokenStatus = await prisma.invitelink.updateMany({
                    where:{
                        token: tokene
                    },
                    data:{
                        status: "close"
                    }
                })
                if(updateTokenStatus !== null){
                    return res.send({registration:"success"})
                } else{
                    return res.send({registration:"failed"})
                }
            }
        }
});

module.exports = router;