"use strict";(self.webpackChunkwcpos=self.webpackChunkwcpos||[]).push([[1434],{3905:(e,t,r)=>{r.d(t,{Zo:()=>l,kt:()=>m});var n=r(7294);function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function a(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){o(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function c(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},i=Object.keys(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}var p=n.createContext({}),s=function(e){var t=n.useContext(p),r=t;return e&&(r="function"==typeof e?e(t):a(a({},t),e)),r},l=function(e){var t=s(e.components);return n.createElement(p.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var r=e.components,o=e.mdxType,i=e.originalType,p=e.parentName,l=c(e,["components","mdxType","originalType","parentName"]),d=s(r),m=o,f=d["".concat(p,".").concat(m)]||d[m]||u[m]||i;return r?n.createElement(f,a(a({ref:t},l),{},{components:r})):n.createElement(f,a({ref:t},l))}));function m(e,t){var r=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var i=r.length,a=new Array(i);a[0]=d;var c={};for(var p in t)hasOwnProperty.call(t,p)&&(c[p]=t[p]);c.originalType=e,c.mdxType="string"==typeof e?e:o,a[1]=c;for(var s=2;s<i;s++)a[s]=r[s];return n.createElement.apply(null,a)}return n.createElement.apply(null,r)}d.displayName="MDXCreateElement"},4522:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>p,contentTitle:()=>a,default:()=>u,frontMatter:()=>i,metadata:()=>c,toc:()=>s});var n=r(3117),o=(r(7294),r(3905));const i={title:"Discounts",description:"WooCommerce POS allows you to quick apply discounts at the point-of-sale."},a=void 0,c={unversionedId:"cart/discounts",id:"version-0.4.x/cart/discounts",title:"Discounts",description:"WooCommerce POS allows you to quick apply discounts at the point-of-sale.",source:"@site/i18n/fr/docusaurus-plugin-content-docs/version-0.4.x/cart/discounts.mdx",sourceDirName:"cart",slug:"/cart/discounts",permalink:"/fr/0.4.x/cart/discounts",draft:!1,editUrl:"https://github.com/wcpos/docs/edit/main/versioned_docs/version-0.4.x/cart/discounts.mdx",tags:[],version:"0.4.x",frontMatter:{title:"Discounts",description:"WooCommerce POS allows you to quick apply discounts at the point-of-sale."},sidebar:"mySidebar",previous:{title:"Shipping",permalink:"/fr/0.4.x/cart/shipping"},next:{title:"Parked Orders",permalink:"/fr/0.4.x/cart/parked-orders"}},p={},s=[{value:"Item Price",id:"item-price",level:3},{value:"Order Discount",id:"order-discount",level:3}],l={toc:s};function u(e){let{components:t,...r}=e;return(0,o.kt)("wrapper",(0,n.Z)({},l,r,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h3",{id:"item-price"},"Item Price"),(0,o.kt)("p",null,"Clicking on the item price will allow you to alter the price ",(0,o.kt)("em",{parentName:"p"},"on-the-fly"),".\nThe item price number pad allows you to enter a new sale price, or a discount as a percentage."),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://wcpos.com/wp-content/uploads/2016/08/product-discount.png",alt:"Reducing the item price by a percentage using the number pad",title:"Reducing the item price by a percentage using the number pad"})),(0,o.kt)("h3",{id:"order-discount"},"Order Discount"),(0,o.kt)("p",null,"You can apply an order discount by adding a negative Fee to the cart.\nClick on the title to rename the Fee.\nClick on the arrow to change the tax status and rate."),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://wcpos.com/wp-content/uploads/2016/08/negative-fee.png",alt:"Order Discount Numpad",title:"Using a negative Fee to apply an Order Discount"})))}u.isMDXComponent=!0}}]);