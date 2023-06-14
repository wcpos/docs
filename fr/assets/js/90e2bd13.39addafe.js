"use strict";(self.webpackChunkwcpos=self.webpackChunkwcpos||[]).push([[4274],{3905:(e,t,r)=>{r.d(t,{Zo:()=>c,kt:()=>f});var n=r(7294);function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function s(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){o(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function a(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},i=Object.keys(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}var l=n.createContext({}),u=function(e){var t=n.useContext(l),r=t;return e&&(r="function"==typeof e?e(t):s(s({},t),e)),r},c=function(e){var t=u(e.components);return n.createElement(l.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},m=n.forwardRef((function(e,t){var r=e.components,o=e.mdxType,i=e.originalType,l=e.parentName,c=a(e,["components","mdxType","originalType","parentName"]),m=u(r),f=o,y=m["".concat(l,".").concat(f)]||m[f]||p[f]||i;return r?n.createElement(y,s(s({ref:t},c),{},{components:r})):n.createElement(y,s({ref:t},c))}));function f(e,t){var r=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var i=r.length,s=new Array(i);s[0]=m;var a={};for(var l in t)hasOwnProperty.call(t,l)&&(a[l]=t[l]);a.originalType=e,a.mdxType="string"==typeof e?e:o,s[1]=a;for(var u=2;u<i;u++)s[u]=r[u];return n.createElement.apply(null,s)}return n.createElement.apply(null,r)}m.displayName="MDXCreateElement"},4662:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>l,contentTitle:()=>s,default:()=>p,frontMatter:()=>i,metadata:()=>a,toc:()=>u});var n=r(3117),o=(r(7294),r(3905));const i={title:"Multi Inventory Stores"},s=void 0,a={unversionedId:"stores/multi-inventory",id:"version-0.4.x/stores/multi-inventory",title:"Multi Inventory Stores",description:"Multi-inventory is not currently a feature of the Pro plugin.",source:"@site/i18n/fr/docusaurus-plugin-content-docs/version-0.4.x/stores/multi-inventory.mdx",sourceDirName:"stores",slug:"/stores/multi-inventory",permalink:"/fr/0.4.x/stores/multi-inventory",draft:!1,editUrl:"https://github.com/wcpos/docs/edit/main/versioned_docs/version-0.4.x/stores/multi-inventory.mdx",tags:[],version:"0.4.x",frontMatter:{title:"Multi Inventory Stores"},sidebar:"mySidebar",previous:{title:"Stores",permalink:"/fr/0.4.x/stores/"},next:{title:"Opening Hours",permalink:"/fr/0.4.x/stores/opening-hours"}},l={},u=[],c={toc:u};function p(e){let{components:t,...r}=e;return(0,o.kt)("wrapper",(0,n.Z)({},c,r,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("admonition",{type:"important"},(0,o.kt)("p",{parentName:"admonition"},"Multi-inventory is not currently a feature of the Pro plugin.\nThe following information is intended to assist users until WooCommerce POS Pro officially supports multi-inventory.")),(0,o.kt)("p",null,"Multi-inventory stores is one of the most requested features for WooCommerce POS Pro.\nThis feature would allow stores owners to assign products to different stores and manage the stock between each physical store and the online store."),(0,o.kt)("p",null,"Creating multi-inventory functionality is a non-trivial task.\nThere are a couple of plugins already working on the problem, such as ",(0,o.kt)("a",{parentName:"p",href:"https://codecanyon.net/item/woocommerce-warehouses/13087646"},"WooCommerce Warehouses")," and ",(0,o.kt)("a",{parentName:"p",href:"http://woomultistore.com/"},"WooCommerce MultiStore"),".\nCurrently it makes sense to focus development on other core POS features and integrate with one of these plugins once they mature to stable solutions."),(0,o.kt)("p",null,"In the short term, you may be able to meet most of your requirements using the ",(0,o.kt)("a",{parentName:"p",href:"https://codex.wordpress.org/Create_A_Network"},"WordPress MultiSite feature"),".\nBy creating a site for each store, you can then install WooCommerce and WooCommerce POS on each site, keeping each store inventory completely separate.\nWooCommerce Multisite (mentioned above) uses this approach with an added layer to manage inventory between sites."))}p.isMDXComponent=!0}}]);