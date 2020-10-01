var express = require('express');
var router = express.Router();
var { PrismaClient } = require('@prisma/client')

var prisma = new PrismaClient();

/* GET users listing. */
router.post('/login',async function(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  var username = req.body.username;
  var password = req.body.password;
  const verifyUser = await prisma.user.findFirst({
    where : {
      username: username
    }
  });
  if(verifyUser !== null && verifyUser.password === password && verifyUser.status === "open"){
    const getRole = await prisma.roles.findFirst({
      where : {
        id: verifyUser.roleid
      }
    });
    var roles = getRole.role;
    if(roles === "seller"){
      const getStatus = await prisma.userstatus.findFirst({
        where : {
          userid: verifyUser.id
        }
      });
      if(getStatus.status === "accept"){
        return res.send({signing:"success" , role: roles})
      } 
      else {
        return res.send({signing:"failed" , status : getStatus.status})
      }
    } else{
      return res.send({signing:"success" , role: roles})
    }
  } else{
    res.send({signing:"failed"});
  }
});

router.post('/signup',async function(req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  var role = req.body.role;
  const checkUser = await prisma.user.findFirst({
    where : {
      username: username
    }
  }); 
  if(checkUser === null){
    const getRole = await prisma.roles.findFirst({
      where : {
        role: role
      }
    });
    if(getRole.role === "user"){
      const insertUser = await prisma.user.create({
        data: {
          username: username,
          password: password,
          roleid: getRole.id,
          status: "open"
        }
      });
      if(insertUser !== null){
        return res.send({registration: "successfull"});
      } else{
        return res.send({registration: "failed"});
      }
    } else {
      const insertUser = await prisma.user.create({
        data: {
          username: username,
          password: password,
          roleid: getRole.id,
          status: "open"
        }
      });
      const insertUserStatus = await prisma.userstatus.create({
        data: {
          userid: insertUser.id,
          status: "pending",
          adminid: 0
        }
      });
      if(insertUserStatus!==null){
        res.send({registration:"success"})
      } else{
        const deleteUser = await prisma.user.delete({
          where: {
            username: username
          }
        });
        res.send({registration: "failed"});
      }
    }
  } else{
    res.send({registration : "failed"});
  }
});

router.post('/decativate',async function(req,res,next){
  var username = req.body.username;
  var deactivateAccount = await prisma.user.updateMany({
    where:{
      username:username
    },data:{
      status: "deactivated"
    }
  });
  if(deactivateAccount.length === 0){
    return res.send({deactivate: "success"});
  } else{
    return res.send({deactivate: "failed"});
  }
})

module.exports = router;
