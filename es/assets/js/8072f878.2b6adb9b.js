"use strict";(self.webpackChunkwcpos=self.webpackChunkwcpos||[]).push([[2755],{3905:(e,r,n)=>{n.d(r,{Zo:()=>p,kt:()=>m});var t=n(7294);function o(e,r,n){return r in e?Object.defineProperty(e,r,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[r]=n,e}function i(e,r){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var t=Object.getOwnPropertySymbols(e);r&&(t=t.filter((function(r){return Object.getOwnPropertyDescriptor(e,r).enumerable}))),n.push.apply(n,t)}return n}function a(e){for(var r=1;r<arguments.length;r++){var n=null!=arguments[r]?arguments[r]:{};r%2?i(Object(n),!0).forEach((function(r){o(e,r,n[r])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(n,r))}))}return e}function s(e,r){if(null==e)return{};var n,t,o=function(e,r){if(null==e)return{};var n,t,o={},i=Object.keys(e);for(t=0;t<i.length;t++)n=i[t],r.indexOf(n)>=0||(o[n]=e[n]);return o}(e,r);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(t=0;t<i.length;t++)n=i[t],r.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var l=t.createContext({}),c=function(e){var r=t.useContext(l),n=r;return e&&(n="function"==typeof e?e(r):a(a({},r),e)),n},p=function(e){var r=c(e.components);return t.createElement(l.Provider,{value:r},e.children)},d={inlineCode:"code",wrapper:function(e){var r=e.children;return t.createElement(t.Fragment,{},r)}},u=t.forwardRef((function(e,r){var n=e.components,o=e.mdxType,i=e.originalType,l=e.parentName,p=s(e,["components","mdxType","originalType","parentName"]),u=c(n),m=o,f=u["".concat(l,".").concat(m)]||u[m]||d[m]||i;return n?t.createElement(f,a(a({ref:r},p),{},{components:n})):t.createElement(f,a({ref:r},p))}));function m(e,r){var n=arguments,o=r&&r.mdxType;if("string"==typeof e||o){var i=n.length,a=new Array(i);a[0]=u;var s={};for(var l in r)hasOwnProperty.call(r,l)&&(s[l]=r[l]);s.originalType=e,s.mdxType="string"==typeof e?e:o,a[1]=s;for(var c=2;c<i;c++)a[c]=n[c];return t.createElement.apply(null,a)}return t.createElement.apply(null,n)}u.displayName="MDXCreateElement"},5161:(e,r,n)=>{n.r(r),n.d(r,{assets:()=>l,contentTitle:()=>a,default:()=>d,frontMatter:()=>i,metadata:()=>s,toc:()=>c});var t=n(3117),o=(n(7294),n(3905));const i={title:"Filtering orders by POS or Online sales",description:"Separate POS and Online orders by using the quick-links in the WooCommerce admin."},a=void 0,s={unversionedId:"admin/filtering-orders",id:"version-0.4.x/admin/filtering-orders",title:"Filtering orders by POS or Online sales",description:"Separate POS and Online orders by using the quick-links in the WooCommerce admin.",source:"@site/versioned_docs/version-0.4.x/admin/filtering-orders.mdx",sourceDirName:"admin",slug:"/admin/filtering-orders",permalink:"/docs/es/0.4.x/admin/filtering-orders",draft:!1,editUrl:"https://github.com/wcpos/docs/edit/main/versioned_docs/version-0.4.x/admin/filtering-orders.mdx",tags:[],version:"0.4.x",frontMatter:{title:"Filtering orders by POS or Online sales",description:"Separate POS and Online orders by using the quick-links in the WooCommerce admin."},sidebar:"autogeneratedDocsSidebar",previous:{title:"WooCommerce POS Pro",permalink:"/docs/es/0.4.x/installation/woocommerce-pos-pro"},next:{title:"Cart",permalink:"/docs/es/0.4.x/cart/"}},l={},c=[],p={toc:c};function d(e){let{components:r,...n}=e;return(0,o.kt)("wrapper",(0,t.Z)({},p,n,{components:r,mdxType:"MDXLayout"}),(0,o.kt)("p",null,"You can quickly separate your POS and Online orders in the WooCommerce admin by using the quick-links to the top left.\n",(0,o.kt)("strong",{parentName:"p"},"Please note:")," this will only filter POS orders after version 0.3.1, orders prior to 0.3.1 will default to Online."),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://wcpos.com/wp-content/uploads/2014/09/filter-orders-e1409558012346.png",alt:"Filter Orders",title:"Filter Orders"})),(0,o.kt)("p",null,"Additionally, if you wanted to filter all the completed orders from your admin area so you can focus on the pending/processing orders, you can add the following code to your ",(0,o.kt)("a",{parentName:"p",href:"http://codex.wordpress.org/Functions_File_Explained"},"functions.php")," file."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-php"},"/**\n * Change default filter of orders in WP admin\n * add this to your functions.php file\n */\nadd_action( 'admin_menu', 'change_default_order_filter', 99 );\nfunction change_default_order_filter() {\n    global $submenu;\n    if (isset($submenu['woocommerce'])) {\n        $submenu['woocommerce'][1][2] = 'edit.php?post_type=shop_order&shop_order_status=pending,processing';\n    }\n}\n")))}d.isMDXComponent=!0}}]);