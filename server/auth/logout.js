import { destroySession,requireSameOrigin } from '../_auth.js';
export default async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow',['POST']);return res.status(405).json({ok:false,error:'Method not allowed'});}
  if(!requireSameOrigin(req,res))return;
  await destroySession(req,res); return res.status(200).json({ok:true});
}
