require('dotenv').config();
var express = require('express');
var router = express.Router();
var { PrismaClient } = require('@prisma/client')
var jwt = require('jsonwebtoken');
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
    const user={ 
      name: verifyUser.username,
      password: verifyUser.password,
      role: roles
    }
    const accessToken = jwt.sign(user,process.env.SECRET_KEY,{expiresIn:'20m'});
    const refreshToken = jwt.sign(user,process.env.REFRESH_KEY);
    if(roles === "seller"){
      const getStatus = await prisma.userstatus.findFirst({
        where : {
          userid: verifyUser.id
        }
      });
      if(getStatus.status === "accept"){
        const addtoken = await prisma.refreshtokens.create({
          data:{
            token: refreshToken
          }
        })
        if(addtoken!== null){
          return res.send({signing:"success" , role: roles,token: accessToken,refresh: refreshToken})
        } else{
          return res.sendStatus(401);
        }
      } 
      else {
        return res.send({signing:"failed" , status : getStatus.status})
      }
    } else{
      const addtoken = await prisma.refreshtokens.create({
        data:{
          token: refreshToken
        }
      })
      if(addtoken!== null){
        return res.send({signing:"success" , role: roles,token: accessToken,refresh: refreshToken})
      } else{
        return res.sendStatus(401);
      }
    }
  } else{
    res.send({signing:"failed"});
  }
});

router.post('/refreshtoken',async function(req,res,next) {
  const refreshToken = req.body.token;
  if(refreshToken === null)return res.sendStatus(401)
  const isTokenExist = await prisma.refreshtokens.findMany({
    where:{
      tokens: refreshToken
    }
  })
  if(isTokenExist.length === 0){
    return res.sendStatus(403);
  } else{
    jwt.verify(token,process.env.REFRESH_KEY,(err,name) =>{
      if(err) return res.sendStaus(403);
      const accessToken = jwt.sign(name,process.env.SECRET_KEY,{expiresIn:'20m'});
      return res.send({token: accessToken});
    })
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

router.post('/logout',async function(req,res){//Needed refresh token to logout
  const refToken = req.body.refreshtoken;
  const ref = await prisma.refreshtokens.delete({
    where:{
      tokens: refToken
    }
  })
  if(ref !== null || ref.length !==0){
    return res.send({logout:'successful'});
  } else{
    return res.send({logout:'error'});
  }
});

module.exports = router;
