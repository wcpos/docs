"use strict";(self.webpackChunkwcpos=self.webpackChunkwcpos||[]).push([[8478],{3905:(e,t,r)=>{r.d(t,{Zo:()=>c,kt:()=>m});var n=r(7294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function s(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function o(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?s(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):s(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function i(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},s=Object.keys(e);for(n=0;n<s.length;n++)r=s[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(n=0;n<s.length;n++)r=s[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var l=n.createContext({}),p=function(e){var t=n.useContext(l),r=t;return e&&(r="function"==typeof e?e(t):o(o({},t),e)),r},c=function(e){var t=p(e.components);return n.createElement(l.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,s=e.originalType,l=e.parentName,c=i(e,["components","mdxType","originalType","parentName"]),d=p(r),m=a,g=d["".concat(l,".").concat(m)]||d[m]||u[m]||s;return r?n.createElement(g,o(o({ref:t},c),{},{components:r})):n.createElement(g,o({ref:t},c))}));function m(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var s=r.length,o=new Array(s);o[0]=d;var i={};for(var l in t)hasOwnProperty.call(t,l)&&(i[l]=t[l]);i.originalType=e,i.mdxType="string"==typeof e?e:a,o[1]=i;for(var p=2;p<s;p++)o[p]=r[p];return n.createElement.apply(null,o)}return n.createElement.apply(null,r)}d.displayName="MDXCreateElement"},5298:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>l,contentTitle:()=>o,default:()=>u,frontMatter:()=>s,metadata:()=>i,toc:()=>p});var n=r(3117),a=(r(7294),r(3905));const s={title:"POS Access",description:"Using the POS Access settings, store owners can grant or remove user privileges to the Point of Sale system."},o=void 0,i={unversionedId:"settings/pos-access",id:"version-0.4.x/settings/pos-access",title:"POS Access",description:"Using the POS Access settings, store owners can grant or remove user privileges to the Point of Sale system.",source:"@site/i18n/es/docusaurus-plugin-content-docs/version-0.4.x/settings/pos-access.mdx",sourceDirName:"settings",slug:"/settings/pos-access",permalink:"/docs/es/0.4.x/settings/pos-access",draft:!1,editUrl:"https://github.com/wcpos/docs/edit/main/versioned_docs/version-0.4.x/settings/pos-access.mdx",tags:[],version:"0.4.x",frontMatter:{title:"POS Access",description:"Using the POS Access settings, store owners can grant or remove user privileges to the Point of Sale system."},sidebar:"mySidebar",previous:{title:"General Settings",permalink:"/docs/es/0.4.x/settings/general"},next:{title:"Admin",permalink:"/docs/es/0.4.x/category/admin"}},l={},p=[],c={toc:p};function u(e){let{components:t,...r}=e;return(0,a.kt)("wrapper",(0,n.Z)({},c,r,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("p",null,"Using the POS Access settings, store owners can grant or remove user privileges to the Point of Sale system.\nBy default, the roles ",(0,a.kt)("strong",{parentName:"p"},"Administrator")," and ",(0,a.kt)("strong",{parentName:"p"},"Shop Manager")," are enabled with all capabilities for using the POS.\nIt is recommended you keep the default settings unless you are aware of the consequences.\nFor example, granting the ",(0,a.kt)("inlineCode",{parentName:"p"},"publish_shop_orders")," to the ",(0,a.kt)("inlineCode",{parentName:"p"},"Subscribers")," role would be a ",(0,a.kt)("em",{parentName:"p"},"very")," bad idea."),(0,a.kt)("p",null,(0,a.kt)("img",{parentName:"p",src:"https://wcpos.com/wp-content/uploads/2015/05/user-capabilities.png",alt:"Example of POS Access settings",title:"Example of POS Access settings"})),(0,a.kt)("table",null,(0,a.kt)("thead",{parentName:"table"},(0,a.kt)("tr",{parentName:"thead"},(0,a.kt)("th",{parentName:"tr",align:null},"Capability"),(0,a.kt)("th",{parentName:"tr",align:null},"Access"))),(0,a.kt)("tbody",{parentName:"table"},(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"access_woocommerce_pos"),(0,a.kt)("td",{parentName:"tr",align:null},"Required to access the POS frontend")),(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"manage_woocommerce_pos"),(0,a.kt)("td",{parentName:"tr",align:null},"Required to access the POS admin settings")),(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"read_private_products"),(0,a.kt)("td",{parentName:"tr",align:null},"Required to view products")),(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"edit_product ",(0,a.kt)("br",null)," edit_published_products ",(0,a.kt)("br",null)," edit_others_products"),(0,a.kt)("td",{parentName:"tr",align:null},"Required to edit products and variations")),(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"read_private_shop_orders"),(0,a.kt)("td",{parentName:"tr",align:null},"Required to view orders and receipts")),(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"publish_shop_orders"),(0,a.kt)("td",{parentName:"tr",align:null},"Required to create new orders")),(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"list_users"),(0,a.kt)("td",{parentName:"tr",align:null},"Required to view customers")),(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"create_users"),(0,a.kt)("td",{parentName:"tr",align:null},"Required to create new customers")),(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"edit_users"),(0,a.kt)("td",{parentName:"tr",align:null},"Required to update existing customers")),(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"read_private_shop_coupons"),(0,a.kt)("td",{parentName:"tr",align:null},"Required to view coupons")))),(0,a.kt)("p",null,(0,a.kt)("strong",{parentName:"p"},"Resources:")),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},"More information on ",(0,a.kt)("a",{parentName:"li",href:"https://codex.wordpress.org/Roles_and_Capabilities"},"WordPress Roles & Capabilities")),(0,a.kt)("li",{parentName:"ul"},"More information on ",(0,a.kt)("a",{parentName:"li",href:"http://docs.woothemes.com/document/roles-capabilities/"},"WooCommerce Roles & Capabilities")),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"https://wordpress.org/plugins/user-role-editor/"},"User Role Editor")," - a great plugin for managing Roles and Capabilities"),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"https://wordpress.org/plugins/members/"},"Members")," - another plugin for managing Roles and Capabilities")))}u.isMDXComponent=!0}}]);