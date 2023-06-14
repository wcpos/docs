"use strict";(self.webpackChunkwcpos=self.webpackChunkwcpos||[]).push([[6092],{3905:(e,t,r)=>{r.d(t,{Zo:()=>c,kt:()=>u});var n=r(7294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function o(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?o(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function p(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},o=Object.keys(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var s=n.createContext({}),l=function(e){var t=n.useContext(s),r=t;return e&&(r="function"==typeof e?e(t):i(i({},t),e)),r},c=function(e){var t=l(e.components);return n.createElement(s.Provider,{value:t},e.children)},m={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,o=e.originalType,s=e.parentName,c=p(e,["components","mdxType","originalType","parentName"]),d=l(r),u=a,f=d["".concat(s,".").concat(u)]||d[u]||m[u]||o;return r?n.createElement(f,i(i({ref:t},c),{},{components:r})):n.createElement(f,i({ref:t},c))}));function u(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=r.length,i=new Array(o);i[0]=d;var p={};for(var s in t)hasOwnProperty.call(t,s)&&(p[s]=t[s]);p.originalType=e,p.mdxType="string"==typeof e?e:a,i[1]=p;for(var l=2;l<o;l++)i[l]=r[l];return n.createElement.apply(null,i)}return n.createElement.apply(null,r)}d.displayName="MDXCreateElement"},804:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>m,contentTitle:()=>l,default:()=>f,frontMatter:()=>s,metadata:()=>c,toc:()=>d});var n=r(3117),a=r(7294),o=r(3905);function i(e,t){return i=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e},i(e,t)}const p=function(e){var t,r;function n(){return e.apply(this,arguments)||this}r=e,(t=n).prototype=Object.create(r.prototype),t.prototype.constructor=t,i(t,r);var o=n.prototype;return o.componentDidMount=function(){this._updateIframeContent()},o.componentDidUpdate=function(e,t){this._updateIframeContent()},o._defineUrl=function(){var e=this.props,t=e.id,r=e.file;return"https://gist.github.com/"+t+".js"+(r?"?file="+r:"")},o._updateIframeContent=function(){var e=this.props,t=e.id,r=e.file,n=this.iframeNode,a=n.document;n.contentDocument?a=n.contentDocument:n.contentWindow&&(a=n.contentWindow.document);var o='<html><head><base target="_parent"><style>*{font-size:12px;}</style></head><body '+("onload=\"parent.document.getElementById('"+(r?"gist-"+t+"-"+r:"gist-"+t)+"').style.height=document.body.scrollHeight + 'px'\"")+">"+('<script type="text/javascript" src="'+this._defineUrl()+'"><\/script>')+"</body></html>";a.open(),a.writeln(o),a.close()},o.render=function(){var e=this,t=this.props,r=t.id,n=t.file;return a.createElement("iframe",{ref:function(t){e.iframeNode=t},width:"100%",frameBorder:0,id:n?"gist-"+r+"-"+n:"gist-"+r})},n}(a.PureComponent),s={title:"Receipts",description:"Receipts can be customised by copying the receipt.php template in your theme directory."},l=void 0,c={unversionedId:"receipts",id:"version-0.4.x/receipts",title:"Receipts",description:"Receipts can be customised by copying the receipt.php template in your theme directory.",source:"@site/i18n/es/docusaurus-plugin-content-docs/version-0.4.x/receipts.mdx",sourceDirName:".",slug:"/receipts",permalink:"/es/0.4.x/receipts",draft:!1,editUrl:"https://github.com/wcpos/docs/edit/main/versioned_docs/version-0.4.x/receipts.mdx",tags:[],version:"0.4.x",frontMatter:{title:"Receipts",description:"Receipts can be customised by copying the receipt.php template in your theme directory."},sidebar:"mySidebar",previous:{title:"Payment Gateways",permalink:"/es/0.4.x/checkout/payment-gateways"},next:{title:"Customers",permalink:"/es/0.4.x/customers"}},m={},d=[{value:"Basic Receipt Template",id:"basic-receipt-template",level:3},{value:"Pro Receipt Template",id:"pro-receipt-template",level:3},{value:"Customising the receipt date",id:"customising-the-receipt-date",level:3},{value:"Order Properties",id:"order-properties",level:3}],u={toc:d};function f(e){let{components:t,...r}=e;return(0,o.kt)("wrapper",(0,n.Z)({},u,r,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,"The POS receipt print templates reside in the ",(0,o.kt)("inlineCode",{parentName:"p"},"includes/views/print/tmpl-receipt.php")," file of both the free and the Pro plugins. Receipt templates can be customised by creating a ",(0,o.kt)("inlineCode",{parentName:"p"},"woocommerce-pos/print/tmpl-receipt.php")," file in your theme directory. The code for both templates is included below."),(0,o.kt)("h3",{id:"basic-receipt-template"},"Basic Receipt Template"),(0,o.kt)(p,{id:"04b4a4f1c2792b4efff5",mdxType:"Gist"}),(0,o.kt)("h3",{id:"pro-receipt-template"},"Pro Receipt Template"),(0,o.kt)("p",null,"The Pro Receipt Template allows additional information from the ",(0,o.kt)("a",{parentName:"p",href:"./stores"},"Stores")," admin such as logo, store address, opening hours and special messages."),(0,o.kt)(p,{id:"c9485366a73ceda12041",mdxType:"Gist"}),(0,o.kt)("h3",{id:"customising-the-receipt-date"},"Customising the receipt date"),(0,o.kt)("p",null,"WooCommerce POS uses ",(0,o.kt)("a",{parentName:"p",href:"http://momentjs.com/"},"moment.js")," to localise the date strings. The default date format is ",(0,o.kt)("inlineCode",{parentName:"p"},'"MMMM Do YYYY, h:mm:ss a"'),", eg: May 31st 2015, 7:20:44 pm. Please consult the ",(0,o.kt)("a",{parentName:"p",href:"http://momentjs.com/docs/#/parsing/string-format/"},"moment.js documentation")," for more information on customising the date format."),(0,o.kt)("h3",{id:"order-properties"},"Order Properties"),(0,o.kt)("p",null,"WooCommerce POS uses the json output from the WC REST API to populate the order receipt template. ",(0,o.kt)("a",{parentName:"p",href:"http://woothemes.github.io/woocommerce-rest-api-docs/#view-an-order"},"The WC REST API docs show an example")," of the standard json output. Some additional properties have been added by WooCommerce POS using the ",(0,o.kt)("inlineCode",{parentName:"p"},"woocommerce_api_order_response")," filter."),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:null},"Property"),(0,o.kt)("th",{parentName:"tr",align:null},"Description"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},"cart_discount_tax"),(0,o.kt)("td",{parentName:"tr",align:null},"The tax portion of the cart discount")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},"cashier.id"),(0,o.kt)("td",{parentName:"tr",align:null},"User ID of the Cashier")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},"cashier.first_name"),(0,o.kt)("td",{parentName:"tr",align:null},"First name of the Cashier")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},"cashier.last_name"),(0,o.kt)("td",{parentName:"tr",align:null},"Last name of the Cashier")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},"payment_details.result"),(0,o.kt)("td",{parentName:"tr",align:null},"Payment gateway success or failure")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},"payment_details.message"),(0,o.kt)("td",{parentName:"tr",align:null},"Any messages from the payment gateway")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},"payment_details.redirect"),(0,o.kt)("td",{parentName:"tr",align:null},"Redirect URL for offsite payments, eg: PayPal Standard")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},"payment_details.method","_","{gateway}"),(0,o.kt)("td",{parentName:"tr",align:null},"Any gateway specific messages, eg: Amount Tendered and Change")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},"shipping_lines","[i]",".total_tax"),(0,o.kt)("td",{parentName:"tr",align:null},"Add tax amount for each shipping line")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},"subtotal_tax"),(0,o.kt)("td",{parentName:"tr",align:null},"The tax portion of the subtotal")))),(0,o.kt)(p,{id:"d224c0d4f7a8ed26bf28",mdxType:"Gist"}))}f.isMDXComponent=!0}}]);