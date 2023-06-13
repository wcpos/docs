"use strict";(self.webpackChunkwcpos=self.webpackChunkwcpos||[]).push([[2432],{3905:(t,e,r)=>{r.d(e,{Zo:()=>i,kt:()=>m});var a=r(7294);function n(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function o(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(t);e&&(a=a.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,a)}return r}function l(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?o(Object(r),!0).forEach((function(e){n(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}function p(t,e){if(null==t)return{};var r,a,n=function(t,e){if(null==t)return{};var r,a,n={},o=Object.keys(t);for(a=0;a<o.length;a++)r=o[a],e.indexOf(r)>=0||(n[r]=t[r]);return n}(t,e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(t);for(a=0;a<o.length;a++)r=o[a],e.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(t,r)&&(n[r]=t[r])}return n}var s=a.createContext({}),c=function(t){var e=a.useContext(s),r=e;return t&&(r="function"==typeof t?t(e):l(l({},e),t)),r},i=function(t){var e=c(t.components);return a.createElement(s.Provider,{value:e},t.children)},d={inlineCode:"code",wrapper:function(t){var e=t.children;return a.createElement(a.Fragment,{},e)}},u=a.forwardRef((function(t,e){var r=t.components,n=t.mdxType,o=t.originalType,s=t.parentName,i=p(t,["components","mdxType","originalType","parentName"]),u=c(r),m=n,g=u["".concat(s,".").concat(m)]||u[m]||d[m]||o;return r?a.createElement(g,l(l({ref:e},i),{},{components:r})):a.createElement(g,l({ref:e},i))}));function m(t,e){var r=arguments,n=e&&e.mdxType;if("string"==typeof t||n){var o=r.length,l=new Array(o);l[0]=u;var p={};for(var s in e)hasOwnProperty.call(e,s)&&(p[s]=e[s]);p.originalType=t,p.mdxType="string"==typeof t?t:n,l[1]=p;for(var c=2;c<o;c++)l[c]=r[c];return a.createElement.apply(null,l)}return a.createElement.apply(null,r)}u.displayName="MDXCreateElement"},5813:(t,e,r)=>{r.r(e),r.d(e,{assets:()=>s,contentTitle:()=>l,default:()=>d,frontMatter:()=>o,metadata:()=>p,toc:()=>c});var a=r(3117),n=(r(7294),r(3905));const o={title:"Product Searching and Filtering",description:"You can use search phrases to filter products by any attribute such as id, category and type."},l=void 0,p={unversionedId:"products/searching-filtering",id:"version-0.4.x/products/searching-filtering",title:"Product Searching and Filtering",description:"You can use search phrases to filter products by any attribute such as id, category and type.",source:"@site/versioned_docs/version-0.4.x/products/searching-filtering.mdx",sourceDirName:"products",slug:"/products/searching-filtering",permalink:"/docs/es/0.4.x/products/searching-filtering",draft:!1,editUrl:"https://github.com/wcpos/docs/edit/main/versioned_docs/version-0.4.x/products/searching-filtering.mdx",tags:[],version:"0.4.x",frontMatter:{title:"Product Searching and Filtering",description:"You can use search phrases to filter products by any attribute such as id, category and type."},sidebar:"autogeneratedDocsSidebar",previous:{title:"POS Only Products",permalink:"/docs/es/0.4.x/products/pos-only-products"},next:{title:"Product Stocktake",permalink:"/docs/es/0.4.x/products/stock-taking"}},s={},c=[],i={toc:c};function d(t){let{components:e,...r}=t;return(0,n.kt)("wrapper",(0,a.Z)({},i,r,{components:e,mdxType:"MDXLayout"}),(0,n.kt)("p",null,"With WooCommerce POS you can search for product by title and also by attribute. For example, on the ",(0,n.kt)("a",{parentName:"p",href:"http://demo.wcpos.com/pos/"},"demo site")," a search for ",(0,n.kt)("inlineCode",{parentName:"p"},"woo")," will filter by title, a search for ",(0,n.kt)("inlineCode",{parentName:"p"},"cat:posters")," will filter products by the Posters category and a search for ",(0,n.kt)("inlineCode",{parentName:"p"},"cat:posters woo")," will filter products by Posters category with 'woo' in the title. If you wanted to select the Movie Posters category you could use ",(0,n.kt)("inlineCode",{parentName:"p"},'cat:"movie posters"'),"."),(0,n.kt)("p",null,"Below is a list of some\xa0currently supported search filters."),(0,n.kt)("table",null,(0,n.kt)("thead",{parentName:"table"},(0,n.kt)("tr",{parentName:"thead"},(0,n.kt)("th",{parentName:"tr",align:null},"Search phrase"),(0,n.kt)("th",{parentName:"tr",align:null},"Result"))),(0,n.kt)("tbody",{parentName:"table"},(0,n.kt)("tr",{parentName:"tbody"},(0,n.kt)("td",{parentName:"tr",align:null},(0,n.kt)("img",{parentName:"td",src:"https://wcpos.com/wp-content/uploads/2014/08/free-text-e1409502417821.png",alt:null})),(0,n.kt)("td",{parentName:"tr",align:null},"Searches only the product title")),(0,n.kt)("tr",{parentName:"tbody"},(0,n.kt)("td",{parentName:"tr",align:null},(0,n.kt)("img",{parentName:"td",src:"https://wcpos.com/wp-content/uploads/2014/08/sku-filter-e1410938118873.png",alt:null})),(0,n.kt)("td",{parentName:"tr",align:null},"Filters products by SKU")),(0,n.kt)("tr",{parentName:"tbody"},(0,n.kt)("td",{parentName:"tr",align:null},(0,n.kt)("img",{parentName:"td",src:"https://wcpos.com/wp-content/uploads/2014/08/id-search-e1409502457358.png",alt:null})),(0,n.kt)("td",{parentName:"tr",align:null},"Filters products by id, eg: selects product id 99")),(0,n.kt)("tr",{parentName:"tbody"},(0,n.kt)("td",{parentName:"tr",align:null},(0,n.kt)("img",{parentName:"td",src:"https://wcpos.com/wp-content/uploads/2014/08/cat-search-e1409502508278.png",alt:null})),(0,n.kt)("td",{parentName:"tr",align:null},"Filters products by\xa0category, eg: Posters")),(0,n.kt)("tr",{parentName:"tbody"},(0,n.kt)("td",{parentName:"tr",align:null},(0,n.kt)("img",{parentName:"td",src:"https://wcpos.com/wp-content/uploads/2014/08/title-and-cat-search-e1409502540535.png",alt:null})),(0,n.kt)("td",{parentName:"tr",align:null},"Filters products by\xa0category, eg: Posters AND searches title for 'woo'")),(0,n.kt)("tr",{parentName:"tbody"},(0,n.kt)("td",{parentName:"tr",align:null},(0,n.kt)("img",{parentName:"td",src:"https://wcpos.com/wp-content/uploads/2014/08/two-word-category-search-e1409502574502.png",alt:null})),(0,n.kt)("td",{parentName:"tr",align:null},"Filters products by a two word category, eg:\xa0Movie Posters")),(0,n.kt)("tr",{parentName:"tbody"},(0,n.kt)("td",{parentName:"tr",align:null},(0,n.kt)("img",{parentName:"td",src:"https://wcpos.com/wp-content/uploads/2014/08/category-search-e1409502610687.png",alt:null})),(0,n.kt)("td",{parentName:"tr",align:null},"Filters products by\xa0category, eg: Posters. Equivalent to cat:posters")),(0,n.kt)("tr",{parentName:"tbody"},(0,n.kt)("td",{parentName:"tr",align:null},(0,n.kt)("img",{parentName:"td",src:"https://wcpos.com/wp-content/uploads/2014/08/type-search-e1409502851612.png",alt:null})),(0,n.kt)("td",{parentName:"tr",align:null},"Filters products by type, eg: Simple or Variable")),(0,n.kt)("tr",{parentName:"tbody"},(0,n.kt)("td",{parentName:"tr",align:null},(0,n.kt)("img",{parentName:"td",src:"https://wcpos.com/wp-content/uploads/2014/08/downloadable-search-e1409502879164.png",alt:null})),(0,n.kt)("td",{parentName:"tr",align:null},"Filters downloadable products, eg:\xa0True or False")),(0,n.kt)("tr",{parentName:"tbody"},(0,n.kt)("td",{parentName:"tr",align:null},(0,n.kt)("img",{parentName:"td",src:"https://wcpos.com/wp-content/uploads/2014/08/virtual-search-e1409502927583.png",alt:null})),(0,n.kt)("td",{parentName:"tr",align:null},"Filters virtual\xa0products, eg:\xa0True or False")),(0,n.kt)("tr",{parentName:"tbody"},(0,n.kt)("td",{parentName:"tr",align:null},(0,n.kt)("img",{parentName:"td",src:"https://wcpos.com/wp-content/uploads/2014/08/taxable-search-e1409503208546.png",alt:null})),(0,n.kt)("td",{parentName:"tr",align:null},"Filters taxable\xa0products, eg:\xa0True or False")),(0,n.kt)("tr",{parentName:"tbody"},(0,n.kt)("td",{parentName:"tr",align:null},(0,n.kt)("img",{parentName:"td",src:"https://wcpos.com/wp-content/uploads/2014/08/in-stock-products-search-e1409503248198.png",alt:null})),(0,n.kt)("td",{parentName:"tr",align:null},"Filters in-stock\xa0products, eg:\xa0True or False")),(0,n.kt)("tr",{parentName:"tbody"},(0,n.kt)("td",{parentName:"tr",align:null},(0,n.kt)("img",{parentName:"td",src:"https://wcpos.com/wp-content/uploads/2014/08/backordered-search-e1409503278121.png",alt:null})),(0,n.kt)("td",{parentName:"tr",align:null},"Filters backordered\xa0products, eg:\xa0True or False")),(0,n.kt)("tr",{parentName:"tbody"},(0,n.kt)("td",{parentName:"tr",align:null},(0,n.kt)("img",{parentName:"td",src:"https://wcpos.com/wp-content/uploads/2014/08/featured-search-e1409503309290.png",alt:null})),(0,n.kt)("td",{parentName:"tr",align:null},"Filters featured\xa0products, eg:\xa0True or False")),(0,n.kt)("tr",{parentName:"tbody"},(0,n.kt)("td",{parentName:"tr",align:null},(0,n.kt)("img",{parentName:"td",src:"https://wcpos.com/wp-content/uploads/2014/08/on-sale-products-e1409503335151.png",alt:null})),(0,n.kt)("td",{parentName:"tr",align:null},"Filters on-sale\xa0products, eg:\xa0True or False")))))}d.isMDXComponent=!0}}]);