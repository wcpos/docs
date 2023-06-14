"use strict";(self.webpackChunkwcpos=self.webpackChunkwcpos||[]).push([[4365],{3905:(e,t,r)=>{r.d(t,{Zo:()=>l,kt:()=>d});var n=r(7294);function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?a(Object(r),!0).forEach((function(t){o(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):a(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function s(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},a=Object.keys(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}var p=n.createContext({}),c=function(e){var t=n.useContext(p),r=t;return e&&(r="function"==typeof e?e(t):i(i({},t),e)),r},l=function(e){var t=c(e.components);return n.createElement(p.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},m=n.forwardRef((function(e,t){var r=e.components,o=e.mdxType,a=e.originalType,p=e.parentName,l=s(e,["components","mdxType","originalType","parentName"]),m=c(r),d=o,f=m["".concat(p,".").concat(d)]||m[d]||u[d]||a;return r?n.createElement(f,i(i({ref:t},l),{},{components:r})):n.createElement(f,i({ref:t},l))}));function d(e,t){var r=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=r.length,i=new Array(a);i[0]=m;var s={};for(var p in t)hasOwnProperty.call(t,p)&&(s[p]=t[p]);s.originalType=e,s.mdxType="string"==typeof e?e:o,i[1]=s;for(var c=2;c<a;c++)i[c]=r[c];return n.createElement.apply(null,i)}return n.createElement.apply(null,r)}m.displayName="MDXCreateElement"},2191:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>p,contentTitle:()=>i,default:()=>u,frontMatter:()=>a,metadata:()=>s,toc:()=>c});var n=r(3117),o=(r(7294),r(3905));const a={title:"Customers"},i=void 0,s={unversionedId:"customers",id:"version-0.4.x/customers",title:"Customers",description:"This feature is requires an upgrade to WooCommerce POS Pro.",source:"@site/versioned_docs/version-0.4.x/customers.mdx",sourceDirName:".",slug:"/customers",permalink:"/0.4.x/customers",draft:!1,editUrl:"https://github.com/wcpos/docs/edit/main/versioned_docs/version-0.4.x/customers.mdx",tags:[],version:"0.4.x",frontMatter:{title:"Customers"},sidebar:"mySidebar",previous:{title:"Receipts",permalink:"/0.4.x/receipts"},next:{title:"Coupons",permalink:"/0.4.x/coupons"}},p={},c=[{value:"Capabilities",id:"capabilities",level:3},{value:"WordPress Multisite",id:"wordpress-multisite",level:3}],l={toc:c};function u(e){let{components:t,...r}=e;return(0,o.kt)("wrapper",(0,n.Z)({},l,r,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("admonition",{type:"important"},(0,o.kt)("p",{parentName:"admonition"},"This feature is requires an upgrade to ",(0,o.kt)("a",{parentName:"p",href:"http://wcpos.com/pro"},"WooCommerce POS Pro"),".")),(0,o.kt)("h3",{id:"capabilities"},"Capabilities"),(0,o.kt)("p",null,"Cashiers will need the ",(0,o.kt)("em",{parentName:"p"},"list_users"),", ",(0,o.kt)("em",{parentName:"p"},"create_users")," and ",(0,o.kt)("em",{parentName:"p"},"edit_users")," capabilities to use all the Customer features."),(0,o.kt)("h3",{id:"wordpress-multisite"},"WordPress Multisite"),(0,o.kt)("p",null,"When using ",(0,o.kt)("a",{parentName:"p",href:"https://codex.wordpress.org/Create_A_Network"},"WordPress multisite")," there are some ",(0,o.kt)("a",{parentName:"p",href:"https://github.com/WordPress/WordPress/blob/master/wp-includes/capabilities.php"},"extra checks")," to prevent non ",(0,o.kt)("a",{parentName:"p",href:"https://codex.wordpress.org/Roles_and_Capabilities#Super_Admin"},"Super Admins")," from creating and editing customer."),(0,o.kt)("p",null,"First, in order for non Super Admins to ",(0,o.kt)("strong",{parentName:"p"},"create")," new customers, please enable the following option in ",(0,o.kt)("inlineCode",{parentName:"p"},"Network Admin > Settings"),"."),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://wcpos.com/wp-content/uploads/2016/09/multisite-create-new-users.png",alt:"Multisite option to create new users",title:"Multisite option to create new users"})),(0,o.kt)("p",null,"Additionally, in order for non Super Admins to ",(0,o.kt)("strong",{parentName:"p"},"edit")," customer details, you will need to add the ",(0,o.kt)("inlineCode",{parentName:"p"},"manage_network_users")," capability to the cashier."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-php",metastring:'title="functions.php"',title:'"functions.php"'},"// change the CASHIER_ID, and\n// add to your functions.php file\n\nadd_filter('map_meta_cap', 'wc_pos_map_meta_cap', 10, 3);\n\nfunction wc_pos_map_meta_cap($caps, $cap, $user_id){\n  if(is_pos() && $cap == 'edit_users' && $user_id === CASHIER_ID){\n    $caps = array('edit_users');\n  }\n  return $caps;\n}\n")))}u.isMDXComponent=!0}}]);