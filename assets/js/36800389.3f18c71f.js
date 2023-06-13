"use strict";(self.webpackChunkwcpos=self.webpackChunkwcpos||[]).push([[6392],{3905:(e,t,r)=>{r.d(t,{Zo:()=>c,kt:()=>d});var o=r(7294);function n(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,o)}return r}function p(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?a(Object(r),!0).forEach((function(t){n(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):a(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function s(e,t){if(null==e)return{};var r,o,n=function(e,t){if(null==e)return{};var r,o,n={},a=Object.keys(e);for(o=0;o<a.length;o++)r=a[o],t.indexOf(r)>=0||(n[r]=e[r]);return n}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(o=0;o<a.length;o++)r=a[o],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(n[r]=e[r])}return n}var l=o.createContext({}),i=function(e){var t=o.useContext(l),r=t;return e&&(r="function"==typeof e?e(t):p(p({},t),e)),r},c=function(e){var t=i(e.components);return o.createElement(l.Provider,{value:t},e.children)},m={inlineCode:"code",wrapper:function(e){var t=e.children;return o.createElement(o.Fragment,{},t)}},u=o.forwardRef((function(e,t){var r=e.components,n=e.mdxType,a=e.originalType,l=e.parentName,c=s(e,["components","mdxType","originalType","parentName"]),u=i(r),d=n,f=u["".concat(l,".").concat(d)]||u[d]||m[d]||a;return r?o.createElement(f,p(p({ref:t},c),{},{components:r})):o.createElement(f,p({ref:t},c))}));function d(e,t){var r=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var a=r.length,p=new Array(a);p[0]=u;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s.mdxType="string"==typeof e?e:n,p[1]=s;for(var i=2;i<a;i++)p[i]=r[i];return o.createElement.apply(null,p)}return o.createElement.apply(null,r)}u.displayName="MDXCreateElement"},4306:(e,t,r)=>{r.r(t),r.d(t,{Highlight:()=>c,assets:()=>l,contentTitle:()=>p,default:()=>u,frontMatter:()=>a,metadata:()=>s,toc:()=>i});var o=r(3117),n=(r(7294),r(3905));const a={title:"Reports",description:""},p=void 0,s={unversionedId:"reports",id:"version-0.4.x/reports",title:"Reports",description:"",source:"@site/versioned_docs/version-0.4.x/reports.mdx",sourceDirName:".",slug:"/reports",permalink:"/docs/0.4.x/reports",draft:!1,editUrl:"https://github.com/wcpos/docs/edit/main/versioned_docs/version-0.4.x/reports.mdx",tags:[],version:"0.4.x",frontMatter:{title:"Reports",description:""},sidebar:"autogeneratedDocsSidebar",previous:{title:"Receipts",permalink:"/docs/0.4.x/receipts"},next:{title:"POS Settings",permalink:"/docs/0.4.x/settings/"}},l={},i=[{value:"POS vs Online Sales",id:"pos-vs-online-sales",level:3},{value:"Sales by Cashier",id:"sales-by-cashier",level:3},{value:"Sales by Store",id:"sales-by-store",level:3},{value:"Sales by Payment Method",id:"sales-by-payment-method",level:3}],c=e=>{let{children:t,color:r}=e;return(0,n.kt)("span",{style:{backgroundColor:r,borderRadius:"2px",color:"#fff",padding:"0.2rem"}},t)},m={toc:i,Highlight:c};function u(e){let{components:t,...r}=e;return(0,n.kt)("wrapper",(0,o.Z)({},m,r,{components:t,mdxType:"MDXLayout"}),(0,n.kt)("admonition",{type:"important"},(0,n.kt)("p",{parentName:"admonition"},"This feature requires an upgrade to ",(0,n.kt)("a",{parentName:"p",href:"http://wcpos.com/pro"},"WooCommerce POS Pro"),".")),(0,n.kt)(c,{color:"#25c2a0",mdxType:"Highlight"},"Docusaurus green")," and ",(0,n.kt)(c,{color:"#1877F2",mdxType:"Highlight"},"Facebook blue")," are my favorite colors.",(0,n.kt)("p",null,"I can write ",(0,n.kt)("strong",{parentName:"p"},"Markdown")," alongside my ",(0,n.kt)("em",{parentName:"p"},"JSX"),"!"),(0,n.kt)("h3",{id:"pos-vs-online-sales"},"POS vs Online Sales"),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://wcpos.com/wp-content/uploads/2015/06/sales-report-1024x1019.png",alt:"Example of POS vs Online Sales report",title:"Example of POS vs Online Sales report"})),(0,n.kt)("h3",{id:"sales-by-cashier"},"Sales by Cashier"),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://wcpos.com/wp-content/uploads/2015/06/cashier-report-1024x768.png",alt:"Example of Cashier Report",title:"Example of Cashier Report"})),(0,n.kt)("h3",{id:"sales-by-store"},"Sales by Store"),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://wcpos.com/wp-content/uploads/2015/06/store-report-1024x763.png",alt:"Example of Store Report",title:"Example of Store Report"})),(0,n.kt)("h3",{id:"sales-by-payment-method"},"Sales by Payment Method"),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://wcpos.com/wp-content/uploads/2015/06/gateway-report-1024x767.png",alt:"Example of Payment Method Report",title:"Example of Payment Method Report"})))}u.isMDXComponent=!0}}]);