"use strict";(self.webpackChunkwcpos=self.webpackChunkwcpos||[]).push([[1402],{3905:(t,e,n)=>{n.d(e,{Zo:()=>u,kt:()=>y});var i=n(7294);function o(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function r(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(t);e&&(i=i.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,i)}return n}function l(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?r(Object(n),!0).forEach((function(e){o(t,e,n[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):r(Object(n)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))}))}return t}function a(t,e){if(null==t)return{};var n,i,o=function(t,e){if(null==t)return{};var n,i,o={},r=Object.keys(t);for(i=0;i<r.length;i++)n=r[i],e.indexOf(n)>=0||(o[n]=t[n]);return o}(t,e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);for(i=0;i<r.length;i++)n=r[i],e.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(t,n)&&(o[n]=t[n])}return o}var s=i.createContext({}),p=function(t){var e=i.useContext(s),n=e;return t&&(n="function"==typeof t?t(e):l(l({},e),t)),n},u=function(t){var e=p(t.components);return i.createElement(s.Provider,{value:e},t.children)},c={inlineCode:"code",wrapper:function(t){var e=t.children;return i.createElement(i.Fragment,{},e)}},d=i.forwardRef((function(t,e){var n=t.components,o=t.mdxType,r=t.originalType,s=t.parentName,u=a(t,["components","mdxType","originalType","parentName"]),d=p(n),y=o,b=d["".concat(s,".").concat(y)]||d[y]||c[y]||r;return n?i.createElement(b,l(l({ref:e},u),{},{components:n})):i.createElement(b,l({ref:e},u))}));function y(t,e){var n=arguments,o=e&&e.mdxType;if("string"==typeof t||o){var r=n.length,l=new Array(r);l[0]=d;var a={};for(var s in e)hasOwnProperty.call(e,s)&&(a[s]=e[s]);a.originalType=t,a.mdxType="string"==typeof t?t:o,l[1]=a;for(var p=2;p<r;p++)l[p]=n[p];return i.createElement.apply(null,l)}return i.createElement.apply(null,n)}d.displayName="MDXCreateElement"},3759:(t,e,n)=>{n.r(e),n.d(e,{assets:()=>s,contentTitle:()=>l,default:()=>c,frontMatter:()=>r,metadata:()=>a,toc:()=>p});var i=n(3117),o=(n(7294),n(3905));const r={title:"POS Only Products",description:"Products can be hidden in your online store or at the point of sale using the POS visibility setting."},l=void 0,a={unversionedId:"products/pos-only-products",id:"version-0.4.x/products/pos-only-products",title:"POS Only Products",description:"Products can be hidden in your online store or at the point of sale using the POS visibility setting.",source:"@site/versioned_docs/version-0.4.x/products/pos-only-products.mdx",sourceDirName:"products",slug:"/products/pos-only-products",permalink:"/0.4.x/products/pos-only-products",draft:!1,editUrl:"https://github.com/wcpos/docs/edit/main/versioned_docs/version-0.4.x/products/pos-only-products.mdx",tags:[],version:"0.4.x",frontMatter:{title:"POS Only Products",description:"Products can be hidden in your online store or at the point of sale using the POS visibility setting."},sidebar:"mySidebar",previous:{title:"Searching and Filtering",permalink:"/0.4.x/products/searching-filtering"},next:{title:"Miscellaneous Products",permalink:"/0.4.x/products/miscellaneous-products"}},s={},p=[{value:"Enabling POS Only Products",id:"enabling-pos-only-products",level:3},{value:"POS &amp; Online Visibility",id:"pos--online-visibility",level:3},{value:"Catalog Visibility",id:"catalog-visibility",level:3},{value:"Filter POS Only Products",id:"filter-pos-only-products",level:3},{value:"Bulk Edit",id:"bulk-edit",level:3}],u={toc:p};function c(t){let{components:e,...n}=t;return(0,o.kt)("wrapper",(0,i.Z)({},u,n,{components:e,mdxType:"MDXLayout"}),(0,o.kt)("p",null,"There may be situations where you need to hide a product from either your Online store or your POS.\nWith WooCommerce POS this can be achieved using the POS Visibility setting on the product edit page."),(0,o.kt)("h3",{id:"enabling-pos-only-products"},"Enabling POS Only Products"),(0,o.kt)("p",null,"POS Only Products is not enabled by default.\nTo enable POS Only Products go to ",(0,o.kt)("code",null,"WP Admin > POS > Settings > General")),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://wcpos.com/wp-content/uploads/2014/09/enable-pos-only-products.png",alt:"Enable POS Only Products",title:"Enable POS Only Products"})),(0,o.kt)("p",null,"Enabling POS only products will require an extra database lookup and therefore incur an small performance hit.\nIf you do not use POS Only Products it is recommended you leave this option disabled."),(0,o.kt)("h3",{id:"pos--online-visibility"},"POS & Online Visibility"),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://wcpos.com/wp-content/uploads/2016/08/pos-visibility.png",alt:"POS Visibility",title:"POS Visibility settings on the Product edit page"})),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:null},"Setting"),(0,o.kt)("th",{parentName:"tr",align:null},"Description"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},(0,o.kt)("strong",{parentName:"td"},"POS & Online"),(0,o.kt)("br",null),"(default)"),(0,o.kt)("td",{parentName:"tr",align:null},"Products will be visible both online in your web store and in your physical store")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},(0,o.kt)("strong",{parentName:"td"},"POS Only")),(0,o.kt)("td",{parentName:"tr",align:null},"Product page will not be visible online")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},(0,o.kt)("strong",{parentName:"td"},"Online Only")),(0,o.kt)("td",{parentName:"tr",align:null},"Product will not be visible in the POS")))),(0,o.kt)("h3",{id:"catalog-visibility"},"Catalog Visibility"),(0,o.kt)("p",null,"If you go directly to a POS Only Product page you will get ",(0,o.kt)("code",null,"404 Page Not Found"),".\nHowever, POS Only Products may still appear in the online search and category pages.\nTo hide the products completely from your website you should set Catalog Visibility to Hidden."),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://wcpos.com/wp-content/uploads/2016/08/catalog-visibility.png",alt:"Catalog Visibility",title:"Catalog Visibility settings on the Product edit page"})),(0,o.kt)("h3",{id:"filter-pos-only-products"},"Filter POS Only Products"),(0,o.kt)("p",null,"You can quickly see which products are visible/hidden by using the quick-links on the Products admin page:"),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://wcpos.com/wp-content/uploads/2016/08/pos-visibility-filter.png",alt:"POS Visibility Filter",title:"POS Visibility Filter"})),(0,o.kt)("h3",{id:"bulk-edit"},"Bulk Edit"),(0,o.kt)("p",null,"To change the POS Visibility of multiple products, go to your Products list and select ",(0,o.kt)("code",null,"Edit")," from the ",(0,o.kt)("code",null,"Bulk Actions"),"."),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://wcpos.com/wp-content/uploads/2016/08/pos-visibility-bulk-edit.png",alt:"Bulk Edit POS Visibility",title:"Bulk edit POS Visibility"})))}c.isMDXComponent=!0}}]);