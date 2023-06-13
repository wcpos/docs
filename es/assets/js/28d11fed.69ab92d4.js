"use strict";(self.webpackChunkwcpos=self.webpackChunkwcpos||[]).push([[4690],{3905:(e,t,r)=>{r.d(t,{Zo:()=>i,kt:()=>m});var o=r(7294);function n(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function s(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,o)}return r}function a(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?s(Object(r),!0).forEach((function(t){n(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):s(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function l(e,t){if(null==e)return{};var r,o,n=function(e,t){if(null==e)return{};var r,o,n={},s=Object.keys(e);for(o=0;o<s.length;o++)r=s[o],t.indexOf(r)>=0||(n[r]=e[r]);return n}(e,t);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(o=0;o<s.length;o++)r=s[o],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(n[r]=e[r])}return n}var p=o.createContext({}),c=function(e){var t=o.useContext(p),r=t;return e&&(r="function"==typeof e?e(t):a(a({},t),e)),r},i=function(e){var t=c(e.components);return o.createElement(p.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return o.createElement(o.Fragment,{},t)}},d=o.forwardRef((function(e,t){var r=e.components,n=e.mdxType,s=e.originalType,p=e.parentName,i=l(e,["components","mdxType","originalType","parentName"]),d=c(r),m=n,y=d["".concat(p,".").concat(m)]||d[m]||u[m]||s;return r?o.createElement(y,a(a({ref:t},i),{},{components:r})):o.createElement(y,a({ref:t},i))}));function m(e,t){var r=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var s=r.length,a=new Array(s);a[0]=d;var l={};for(var p in t)hasOwnProperty.call(t,p)&&(l[p]=t[p]);l.originalType=e,l.mdxType="string"==typeof e?e:n,a[1]=l;for(var c=2;c<s;c++)a[c]=r[c];return o.createElement.apply(null,a)}return o.createElement.apply(null,r)}d.displayName="MDXCreateElement"},8837:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>p,contentTitle:()=>a,default:()=>u,frontMatter:()=>s,metadata:()=>l,toc:()=>c});var o=r(3117),n=(r(7294),r(3905));const s={title:"Legacy Servers",description:"If your web host blocks modern RESTful HTTP methods you will need to enable legacy server support."},a=void 0,l={unversionedId:"support/legacy-servers",id:"version-0.4.x/support/legacy-servers",title:"Legacy Servers",description:"If your web host blocks modern RESTful HTTP methods you will need to enable legacy server support.",source:"@site/versioned_docs/version-0.4.x/support/legacy-servers.mdx",sourceDirName:"support",slug:"/support/legacy-servers",permalink:"/docs/es/0.4.x/support/legacy-servers",draft:!1,editUrl:"https://github.com/wcpos/docs/edit/main/versioned_docs/version-0.4.x/support/legacy-servers.mdx",tags:[],version:"0.4.x",frontMatter:{title:"Legacy Servers",description:"If your web host blocks modern RESTful HTTP methods you will need to enable legacy server support."},sidebar:"autogeneratedDocsSidebar",previous:{title:"Debugging",permalink:"/docs/es/0.4.x/support/debugging"},next:{title:"Plugin Conflicts",permalink:"/docs/es/0.4.x/support/plugin-conflicts"}},p={},c=[],i={toc:c};function u(e){let{components:t,...r}=e;return(0,n.kt)("wrapper",(0,o.Z)({},i,r,{components:t,mdxType:"MDXLayout"}),(0,n.kt)("p",null,"HTTP (and HTTPS) are the protocols used by every browser to talk to web applications.\nA key part of the protocol is the ",(0,n.kt)("a",{parentName:"p",href:"https://tools.ietf.org/html/rfc2616#section-5.1.1"},"HTTP method"),".\nTraditionally, web applications used a very limited set of HTTP methods such as GET (retrieve a web page) and POST (submit a web form)."),(0,n.kt)("p",null,"Modern web applications, such as WooCommerce POS, use a REST/HTTP approach with following HTTP Methods:"),(0,n.kt)("ul",null,(0,n.kt)("li",{parentName:"ul"},"GET"),(0,n.kt)("li",{parentName:"ul"},"POST"),(0,n.kt)("li",{parentName:"ul"},"PUT"),(0,n.kt)("li",{parentName:"ul"},"PATCH"),(0,n.kt)("li",{parentName:"ul"},"DELETE")),(0,n.kt)("p",null,"In some rare cases a web host may choose to block some of these HTTP methods.\nIf your web host blocks modern RESTful HTTP methods you will need to enable legacy server support."),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://wcpos.com/wp-content/uploads/2016/06/enable-legacy-server-support.png",alt:"Legacy Server Support",title:"WP Admin > POS > Settings > Tools > Enable legacy server support"})))}u.isMDXComponent=!0}}]);