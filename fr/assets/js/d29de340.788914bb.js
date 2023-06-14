"use strict";(self.webpackChunkwcpos=self.webpackChunkwcpos||[]).push([[6972],{3905:(e,t,r)=>{r.d(t,{Zo:()=>d,kt:()=>m});var n=r(7294);function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function c(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?a(Object(r),!0).forEach((function(t){o(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):a(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function i(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},a=Object.keys(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}var s=n.createContext({}),l=function(e){var t=n.useContext(s),r=t;return e&&(r="function"==typeof e?e(t):c(c({},t),e)),r},d=function(e){var t=l(e.components);return n.createElement(s.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},u=n.forwardRef((function(e,t){var r=e.components,o=e.mdxType,a=e.originalType,s=e.parentName,d=i(e,["components","mdxType","originalType","parentName"]),u=l(r),m=o,f=u["".concat(s,".").concat(m)]||u[m]||p[m]||a;return r?n.createElement(f,c(c({ref:t},d),{},{components:r})):n.createElement(f,c({ref:t},d))}));function m(e,t){var r=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=r.length,c=new Array(a);c[0]=u;var i={};for(var s in t)hasOwnProperty.call(t,s)&&(i[s]=t[s]);i.originalType=e,i.mdxType="string"==typeof e?e:o,c[1]=i;for(var l=2;l<a;l++)c[l]=r[l];return n.createElement.apply(null,c)}return n.createElement.apply(null,r)}u.displayName="MDXCreateElement"},1669:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>s,contentTitle:()=>c,default:()=>p,frontMatter:()=>a,metadata:()=>i,toc:()=>l});var n=r(3117),o=(r(7294),r(3905));const a={title:"Barcode Scanning",description:"WooCommerce POS is able to filter products by the SKU field, this allows you to instantly add products to cart using a barcode scanner."},c=void 0,i={unversionedId:"products/barcode-scanning",id:"version-0.4.x/products/barcode-scanning",title:"Barcode Scanning",description:"WooCommerce POS is able to filter products by the SKU field, this allows you to instantly add products to cart using a barcode scanner.",source:"@site/i18n/fr/docusaurus-plugin-content-docs/version-0.4.x/products/barcode-scanning.mdx",sourceDirName:"products",slug:"/products/barcode-scanning",permalink:"/docs/fr/0.4.x/products/barcode-scanning",draft:!1,editUrl:"https://github.com/wcpos/docs/edit/main/versioned_docs/version-0.4.x/products/barcode-scanning.mdx",tags:[],version:"0.4.x",frontMatter:{title:"Barcode Scanning",description:"WooCommerce POS is able to filter products by the SKU field, this allows you to instantly add products to cart using a barcode scanner."},sidebar:"mySidebar",previous:{title:"Miscellaneous Products",permalink:"/docs/fr/0.4.x/products/miscellaneous-products"},next:{title:"Custom Barcode Field",permalink:"/docs/fr/0.4.x/products/barcode-scanning/custom-barcode-field"}},s={},l=[{value:"Updates",id:"updates",level:3}],d={toc:l};function p(e){let{components:t,...r}=e;return(0,o.kt)("wrapper",(0,n.Z)({},d,r,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,"WooCommerce POS is able to filter products by the SKU field. If a search matches the barcode field exactly the product is added to the cart instantly and the search field is reset. If you have a barcode scanner that is able to populate the search field then you should be use WooCommerce POS for barcode scanning."),(0,o.kt)("p",null,"To see the SKU search in action please go to ",(0,o.kt)("a",{parentName:"p",href:"http://demo.wcpos.com/pos/"},"http://demo.wcpos.com/pos/")),(0,o.kt)("p",null,"Type (or copy & paste) ",(0,o.kt)("inlineCode",{parentName:"p"},"BARCODE")," and an item will be added to the cart."),(0,o.kt)("p",null,"Type (or copy & paste) ",(0,o.kt)("inlineCode",{parentName:"p"},"VARIATION1")," and a variation will be added to the cart."),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://wcpos.com/wp-content/uploads/2014/07/barcode-search.png",alt:"Barcode Scanning in WooCommerce POS",title:"Filtering by the SKU field in WooCommerce POS"})),(0,o.kt)("p",null,"The following features are being planned for future releases:"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},"Add products to WooCommerce using barcode scanner. This will be part of a stocktake mode being planned for a 0.3.x release."),(0,o.kt)("li",{parentName:"ul"},"Barcode scanning using mobile device camera. This will require a native WooCommerce POS app to gain access to the device hardware. Native apps are on the wish list but adding features to\xa0the web version is the highest priority at the moment."),(0,o.kt)("li",{parentName:"ul"},"Hot key activation")),(0,o.kt)("h3",{id:"updates"},"Updates"),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},"Since Version 0.3.1:")," There is now a dedicated mode for Barcode scanning. You can switch between 'Search' mode and 'Scan Barcode' by clicking on the button to the left of the search field."),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://wcpos.com/wp-content/uploads/2014/07/search-scan-mode.png",alt:"Search Scan Barcode modes"})))}p.isMDXComponent=!0}}]);