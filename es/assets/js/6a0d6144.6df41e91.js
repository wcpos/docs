"use strict";(self.webpackChunkwcpos=self.webpackChunkwcpos||[]).push([[2365],{3905:(e,t,r)=>{r.d(t,{Zo:()=>l,kt:()=>m});var n=r(7294);function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function c(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?c(Object(r),!0).forEach((function(t){o(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):c(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function a(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},c=Object.keys(e);for(n=0;n<c.length;n++)r=c[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(e);for(n=0;n<c.length;n++)r=c[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}var s=n.createContext({}),p=function(e){var t=n.useContext(s),r=t;return e&&(r="function"==typeof e?e(t):i(i({},t),e)),r},l=function(e){var t=p(e.components);return n.createElement(s.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var r=e.components,o=e.mdxType,c=e.originalType,s=e.parentName,l=a(e,["components","mdxType","originalType","parentName"]),d=p(r),m=o,f=d["".concat(s,".").concat(m)]||d[m]||u[m]||c;return r?n.createElement(f,i(i({ref:t},l),{},{components:r})):n.createElement(f,i({ref:t},l))}));function m(e,t){var r=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var c=r.length,i=new Array(c);i[0]=d;var a={};for(var s in t)hasOwnProperty.call(t,s)&&(a[s]=t[s]);a.originalType=e,a.mdxType="string"==typeof e?e:o,i[1]=a;for(var p=2;p<c;p++)i[p]=r[p];return n.createElement.apply(null,i)}return n.createElement.apply(null,r)}d.displayName="MDXCreateElement"},6826:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>s,contentTitle:()=>i,default:()=>u,frontMatter:()=>c,metadata:()=>a,toc:()=>p});var n=r(3117),o=(r(7294),r(3905));const c={title:"Discounts",description:"WooCommerce POS allows you to quick apply discounts at the point-of-sale."},i=void 0,a={unversionedId:"cart/discounts",id:"version-0.4.x/cart/discounts",title:"Discounts",description:"WooCommerce POS allows you to quick apply discounts at the point-of-sale.",source:"@site/versioned_docs/version-0.4.x/cart/discounts.mdx",sourceDirName:"cart",slug:"/cart/discounts",permalink:"/docs/es/0.4.x/cart/discounts",draft:!1,editUrl:"https://github.com/wcpos/docs/edit/main/versioned_docs/version-0.4.x/cart/discounts.mdx",tags:[],version:"0.4.x",frontMatter:{title:"Discounts",description:"WooCommerce POS allows you to quick apply discounts at the point-of-sale."},sidebar:"autogeneratedDocsSidebar",previous:{title:"Customers",permalink:"/docs/es/0.4.x/cart/customers"},next:{title:"Fees",permalink:"/docs/es/0.4.x/cart/fees"}},s={},p=[{value:"Item Price",id:"item-price",level:3},{value:"Order Discount",id:"order-discount",level:3}],l={toc:p};function u(e){let{components:t,...r}=e;return(0,o.kt)("wrapper",(0,n.Z)({},l,r,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h3",{id:"item-price"},"Item Price"),(0,o.kt)("p",null,"Clicking on the item price will allow you to alter the price ",(0,o.kt)("em",{parentName:"p"},"on-the-fly"),".\nThe item price number pad allows you to enter a new sale price, or a discount as a percentage."),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://wcpos.com/wp-content/uploads/2016/08/product-discount.png",alt:"Reducing the item price by a percentage using the number pad",title:"Reducing the item price by a percentage using the number pad"})),(0,o.kt)("h3",{id:"order-discount"},"Order Discount"),(0,o.kt)("p",null,"You can apply an order discount by adding a negative Fee to the cart.\nClick on the title to rename the Fee.\nClick on the arrow to change the tax status and rate."),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://wcpos.com/wp-content/uploads/2016/08/negative-fee.png",alt:"Order Discount Numpad",title:"Using a negative Fee to apply an Order Discount"})))}u.isMDXComponent=!0}}]);