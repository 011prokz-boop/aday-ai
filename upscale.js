import Replicate from "replicate";
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
export default async function handler(req,res){
 if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
 if(!process.env.REPLICATE_API_TOKEN) return res.status(500).json({error:"REPLICATE_API_TOKEN орнатылмаған."});
 try{
  const {image,scale=2}=req.body||{};
  if(!image||!image.startsWith("data:image/")) return res.status(400).json({error:"Сурет дұрыс жіберілмеді."});
  const s=Number(scale); if(![2,4,6,8].includes(s)) return res.status(400).json({error:"Масштаб 2/4/6/8 болуы керек."});
  const output=await replicate.run("google/upscaler",{input:{image,upscale_factor:s>=4?"x4":"x2",compression_quality:95}});
  const url=typeof output==="string"?output:(output?.url?output.url():String(output));
  return res.status(200).json({output:url,requested_scale:s,applied_scale:s>=4?4:2});
 }catch(e){console.error(e);return res.status(500).json({error:e?.message||"AI өңдеу қатесі."});}
}
