import { getAuth } from '../_auth.js';
export default async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow',['GET']);return res.status(405).json({ok:false,error:'Method not allowed'});}
  try{const user=await getAuth(req);return user?res.status(200).json({ok:true,user}):res.status(401).json({ok:false,error:'Authentication required',code:'AUTH_REQUIRED'});}catch(e){return res.status(500).json({ok:false,error:'Authentication check failed'});}
}
