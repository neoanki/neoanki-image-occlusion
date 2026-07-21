export interface Rect{id:string;x:number;y:number;width:number;height:number;label?:string}
const clamp=(value:number)=>Math.max(0,Math.min(100,Number.isFinite(value)?value:0))
export const normalize=(rect:Rect):Rect=>{const x=clamp(rect.x),y=clamp(rect.y);return{...rect,x,y,width:Math.max(2,Math.min(100-x,clamp(rect.width))),height:Math.max(2,Math.min(100-y,clamp(rect.height)))}}
export const fromPoints=(start:{x:number;y:number},end:{x:number;y:number},label:string):Rect=>normalize({id:crypto.randomUUID(),x:Math.min(start.x,end.x),y:Math.min(start.y,end.y),width:Math.abs(end.x-start.x),height:Math.abs(end.y-start.y),label})
