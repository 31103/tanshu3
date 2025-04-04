(()=>{let e=new class{constructor(e="toastContainer"){this.activeToasts=[],this.toastHistory=[],this.MAX_VISIBLE_TOASTS=3,this.MAX_HISTORY_ITEMS=10,this.handleHistoryEscKey=e=>{"Escape"===e.key&&this.closeNotificationHistory()},this.toastContainer=document.getElementById(e)||this.createToastContainer(e),this.setupHistoryButton()}createToastContainer(e){let t=document.createElement("div");return t.id=e,t.className="toast-container",document.body.appendChild(t),t}setupHistoryButton(){let e=document.getElementById("notificationHistoryButton");e||((e=document.createElement("button")).id="notificationHistoryButton",e.className="notification-history-button hidden",e.setAttribute("aria-label","通知履歴を表示"),e.innerHTML='<span class="history-icon">\uD83D\uDD14</span>',document.body.appendChild(e),e.addEventListener("click",()=>this.showNotificationHistory()))}showToast(e,t,s,i=5e3,r=3){let a=Date.now(),n="toast-"+a,o={id:n,type:e,title:t,message:s,timestamp:a,priority:r,duration:i};this.addToastToHistory(o),this.activeToasts.push(o),this.activeToasts.sort((e,t)=>e.priority!==t.priority?t.priority-e.priority:t.timestamp-e.timestamp),this.manageActiveToasts(),this.activeToasts.some(e=>e.id===n)&&this.renderToast(o)}addToastToHistory(e){this.toastHistory.unshift({type:e.type,title:e.title,message:e.message,timestamp:e.timestamp}),this.toastHistory.length>this.MAX_HISTORY_ITEMS&&(this.toastHistory=this.toastHistory.slice(0,this.MAX_HISTORY_ITEMS)),this.updateHistoryButton()}updateHistoryButton(){let e=document.getElementById("notificationHistoryButton");e&&this.toastHistory.length>0&&(e.classList.remove("hidden"),e.setAttribute("data-count",this.toastHistory.length.toString()))}manageActiveToasts(){if(this.activeToasts.sort((e,t)=>e.priority!==t.priority?t.priority-e.priority:t.timestamp-e.timestamp),this.activeToasts.length>this.MAX_VISIBLE_TOASTS){let e=this.activeToasts.slice(0,this.MAX_VISIBLE_TOASTS);this.activeToasts.slice(this.MAX_VISIBLE_TOASTS).forEach(e=>{e.element&&this.removeToastElement(e.id)}),this.activeToasts=e}}showNotificationHistory(){let e=document.getElementById("notificationHistoryModal");e&&e.parentNode?.removeChild(e);let t=document.createElement("div");t.id="notificationHistoryModal",t.className="notification-history-modal",t.setAttribute("role","dialog"),t.setAttribute("aria-labelledby","notificationHistoryTitle"),t.setAttribute("aria-modal","true");let s="";this.toastHistory.forEach(e=>{if(e.timestamp){let t=new Date(e.timestamp).toLocaleTimeString();s+=`
          <div class="history-item history-item-${e.type}">
            <div class="history-item-time">${t}</div>
            <div class="history-item-content">
              <h4 class="history-item-title">${e.title||""}</h4>
              <p class="history-item-message">${e.message||""}</p>
            </div>
          </div>
        `}}),t.innerHTML=`
      <div class="notification-history-content">
        <div class="notification-history-header">
          <h3 id="notificationHistoryTitle">\u{901A}\u{77E5}\u{5C65}\u{6B74}</h3>
          <button class="notification-history-close" aria-label="\u{5C65}\u{6B74}\u{3092}\u{9589}\u{3058}\u{308B}">\xd7</button>
        </div>
        <div class="notification-history-list">
          ${s.length?s:'<p class="no-history">通知履歴はありません</p>'}
        </div>
        <div class="notification-history-footer">
          <button class="secondary-button notification-history-clear">\u{5C65}\u{6B74}\u{3092}\u{30AF}\u{30EA}\u{30A2}</button>
          <button class="primary-button notification-history-close-btn">\u{9589}\u{3058}\u{308B}</button>
        </div>
      </div>
    `,document.body.appendChild(t),setTimeout(()=>{t.classList.add("active")},10),t.querySelectorAll(".notification-history-close, .notification-history-close-btn").forEach(e=>{e.addEventListener("click",()=>{this.closeNotificationHistory()})});let i=t.querySelector(".notification-history-clear");i?.addEventListener("click",()=>{this.clearNotificationHistory(),this.closeNotificationHistory()}),t.addEventListener("click",e=>{e.target===t&&this.closeNotificationHistory()}),document.addEventListener("keydown",this.handleHistoryEscKey)}closeNotificationHistory(){let e=document.getElementById("notificationHistoryModal");e&&(e.classList.remove("active"),setTimeout(()=>{e.parentNode&&e.parentNode.removeChild(e)},300)),document.removeEventListener("keydown",this.handleHistoryEscKey)}clearNotificationHistory(){this.toastHistory=[],this.updateHistoryButton()}renderToast(e){let t=document.createElement("div");t.id=e.id,t.className=`toast toast-${e.type}`,t.setAttribute("role","alert"),t.setAttribute("aria-live","assertive");let s="";switch(e.type){case"success":s="✅";break;case"warning":s="⚠️";break;case"error":s="❌";break;case"info":s="ℹ️"}t.innerHTML=`
      <div class="toast-icon">${s}</div>
      <div class="toast-content">
        <h3 class="toast-title">${e.title}</h3>
        <p class="toast-message">${e.message}</p>
      </div>
      <button class="toast-close" aria-label="\u{901A}\u{77E5}\u{3092}\u{9589}\u{3058}\u{308B}">\xd7</button>
    `,this.toastContainer.appendChild(t),e.element=t;let i=t.querySelector(".toast-close");i?.addEventListener("click",()=>{this.removeToast(e.id)}),e.duration>0&&setTimeout(()=>{this.removeToast(e.id)},e.duration)}removeToast(e){this.activeToasts=this.activeToasts.filter(t=>t.id!==e),this.removeToastElement(e)}removeToastElement(e){let t=document.getElementById(e);t&&(t.style.opacity="0",t.style.transform="translateX(100%)",setTimeout(()=>{t.parentNode&&t.parentNode.removeChild(t)},300))}showRecoveryToast(e){let t="toast-recovery-"+Date.now(),s=document.createElement("div");s.id=t,s.className="toast toast-info",s.setAttribute("role","alert"),s.setAttribute("aria-live","assertive"),s.innerHTML=`
      <div class="toast-icon">\u{1F504}</div>
      <div class="toast-content">
        <h3 class="toast-title">\u{56DE}\u{5FA9}\u{30A2}\u{30AF}\u{30B7}\u{30E7}\u{30F3}</h3>
        <p class="toast-message">${e.message}</p>
      </div>
      <button class="toast-action" aria-label="${e.label}">${e.label}</button>
      <button class="toast-close" aria-label="\u{901A}\u{77E5}\u{3092}\u{9589}\u{3058}\u{308B}">\xd7</button>
    `,this.toastContainer.appendChild(s);let i=s.querySelector(".toast-action");i?.addEventListener("click",()=>{e.handler(),this.removeToastElement(t)});let r=s.querySelector(".toast-close");r?.addEventListener("click",()=>{this.removeToastElement(t)}),setTimeout(()=>{this.removeToastElement(t)},15e3)}};async function t(e){if(!e||0===e.length)throw Error("ファイルが選択されていません");let t=[];for(let i of e)try{let e=await s(i),r=function(e,t){var s,i;let r={file:e,isValid:!0,warnings:[],errors:[]};if(s=t,i=r,s.trim()?!!(s.split(/\r?\n/).filter(e=>e.trim()).length<2)&&(i.isValid=!1,i.errors.push("ファイルが空か、ヘッダー行またはデータ行が不足しています"),!0):(i.isValid=!1,i.errors.push("ファイルが空です"),!0))return r;let a=t.split(/\r?\n/);return function(e,t){let s=e.trim();s?s.includes("	")||t.warnings.push("ヘッダー行にタブ区切りが見られません"):t.warnings.push("ヘッダー行が空のようです")}(a[0],r),function(e,t){let s=Math.min(5,e.length-1),i=!1,r=!1,a=!1;for(let n=1;n<=s;n++){if(void 0===e[n])continue;let s=e[n].trim();if(!s)continue;let o=function(e,t,s){let i=!1,r=!1,a=!1;if(!e.includes("	"))return{tabWarningIssued:i=!0,columnCountWarningIssued:r,actionDetailNumWarningIssued:a};let n=e.split("	");if(n.length<10)return{tabWarningIssued:i,columnCountWarningIssued:r=!0,actionDetailNumWarningIssued:a};let o=function(e,t,s){let i=!1,r=!1;if(e.length>3){let i=e[3].trim();/^(\d{8}|00000000)$/.test(i)||(s.isValid=!1,0!==s.errors.length&&s.errors.some(e=>e.startsWith("入院年月日"))||s.errors.push(`\u{5165}\u{9662}\u{5E74}\u{6708}\u{65E5}(4\u{5217}\u{76EE})\u{306E}\u{5F62}\u{5F0F}\u{304C}\u{4E0D}\u{6B63}\u{3067}\u{3059} (yyyymmdd or 00000000) (\u{6700}\u{521D}\u{306E}\u{4F8B}: \u{884C} ${t+1}, \u{5024}: ${i})`))}else i=!0;if(e.length>6){let t=e[6].trim();/^(000|\d{3})$/.test(t)||(r=!0)}else i||(i=!0);return{columnCountWarningIssued:i,actionDetailNumWarningIssued:r}}(n,t,s);return r=o.columnCountWarningIssued,{tabWarningIssued:i,columnCountWarningIssued:r,actionDetailNumWarningIssued:a=o.actionDetailNumWarningIssued}}(s,n,t);if(o.tabWarningIssued&&!i&&(t.warnings.push(`\u{4E00}\u{90E8}\u{306E}\u{30C7}\u{30FC}\u{30BF}\u{884C}\u{306B}\u{30BF}\u{30D6}\u{533A}\u{5207}\u{308A}\u{304C}\u{898B}\u{3089}\u{308C}\u{307E}\u{305B}\u{3093} (\u{6700}\u{521D}\u{306E}\u{4F8B}: \u{884C} ${n+1})`),i=!0),o.columnCountWarningIssued&&!r){let e=s.split("	");e.length<4?t.warnings.push(`\u{4E00}\u{90E8}\u{306E}\u{30C7}\u{30FC}\u{30BF}\u{884C}\u{3067}\u{5165}\u{9662}\u{5E74}\u{6708}\u{65E5}(4\u{5217}\u{76EE})\u{304C}\u{78BA}\u{8A8D}\u{3067}\u{304D}\u{307E}\u{305B}\u{3093} (\u{5217}\u{6570}\u{4E0D}\u{8DB3}) (\u{6700}\u{521D}\u{306E}\u{4F8B}: \u{884C} ${n+1})`):e.length<7?t.warnings.push(`\u{4E00}\u{90E8}\u{306E}\u{30C7}\u{30FC}\u{30BF}\u{884C}\u{3067}\u{884C}\u{70BA}\u{660E}\u{7D30}\u{756A}\u{53F7}(7\u{5217}\u{76EE})\u{304C}\u{78BA}\u{8A8D}\u{3067}\u{304D}\u{307E}\u{305B}\u{3093} (\u{5217}\u{6570}\u{4E0D}\u{8DB3}) (\u{6700}\u{521D}\u{306E}\u{4F8B}: \u{884C} ${n+1})`):t.warnings.push(`\u{4E00}\u{90E8}\u{306E}\u{30C7}\u{30FC}\u{30BF}\u{884C}\u{306E}\u{5217}\u{6570}\u{304C}\u{5C11}\u{306A}\u{3044}\u{3088}\u{3046}\u{3067}\u{3059} (10\u{5217}\u{672A}\u{6E80}) (\u{6700}\u{521D}\u{306E}\u{4F8B}: \u{884C} ${n+1}, \u{5217}\u{6570}: ${e.length})`),r=!0}if(o.actionDetailNumWarningIssued&&!a){let e=s.split("	"),i=e.length>6?e[6].trim():"";t.warnings.push(`\u{884C}\u{70BA}\u{660E}\u{7D30}\u{756A}\u{53F7}(7\u{5217}\u{76EE})\u{306E}\u{5F62}\u{5F0F}\u{304C}\u{4E0D}\u{6B63}\u{306E}\u{3088}\u{3046}\u{3067}\u{3059} (000 or 3\u{6841}\u{6570}\u{5B57}) (\u{6700}\u{521D}\u{306E}\u{4F8B}: \u{884C} ${n+1}, \u{5024}: ${i})`),a=!0}}}(a,r),r}(i,e);t.push(r)}catch{t.push({file:i,isValid:!1,warnings:[],errors:["不明なエラーが発生しました"]})}return t}function s(e){return e.type.includes("text")||e.name.endsWith(".txt")?new Promise((t,s)=>{let i=new FileReader;i.onload=e=>{"string"==typeof e.target?.result?t(e.target.result):s(Error("Read error: Invalid file format"))},i.onerror=()=>{s(Error("Read error: File read failed"))};try{i.readAsText(e)}catch{s(Error("Read error: Cannot start reading file"))}}):Promise.reject(Error("Read error: Invalid file format"))}class i{constructor(){if(this.selectedFiles=[],this.validFiles=0,this.fileInput=document.getElementById("fileInput"),this.fileInfoArea=document.getElementById("fileInfoArea"),this.clearButton=document.getElementById("clearButton"),this.executeButton=document.getElementById("executeButton"),this.dropArea=document.getElementById("dropArea"),!this.fileInput||!this.fileInfoArea||!this.clearButton||!this.executeButton||!this.dropArea)throw Error("必要なDOM要素が見つかりません");this.setupEventListeners()}setupEventListeners(){let e=document.getElementById("fileSelectButton");e&&e.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),this.fileInput.click()}),this.fileInput.addEventListener("change",()=>{this.processNewFiles(Array.from(this.fileInput.files||[]))}),this.dropArea.addEventListener("dragover",e=>this.handleDragOver(e)),this.dropArea.addEventListener("dragleave",e=>this.handleDragLeave(e)),this.dropArea.addEventListener("drop",e=>this.handleDrop(e)),this.dropArea.addEventListener("keydown",e=>{("Enter"===e.key||" "===e.key)&&(e.preventDefault(),this.fileInput.click())}),this.dropArea.addEventListener("click",e=>{"BUTTON"!==e.target.tagName&&this.fileInput.click()}),this.clearButton.addEventListener("click",()=>{this.clearFiles()})}handleDragOver(e){e.preventDefault(),this.dropArea.classList.add("drag-over")}handleDragLeave(e){e.preventDefault(),this.dropArea.classList.remove("drag-over")}handleDrop(e){e.preventDefault(),this.dropArea.classList.remove("drag-over"),e.dataTransfer&&e.dataTransfer.files.length>0&&this.processNewFiles(Array.from(e.dataTransfer.files))}async processNewFiles(t){let s=Array.from(t).filter(e=>"text/plain"===e.type||e.name.endsWith(".txt"));if(s.length<t.length){this.handleError(Error("テキストファイル以外が含まれています"),"file-format");return}let i=Array.from(this.selectedFiles).map(e=>e.name),r=s.filter(e=>!i.includes(e.name)),a=s.length-r.length;r.forEach(e=>this.selectedFiles.push(e)),this.updateFileInfo(),0===r.length&&s.length>0?this.handleError(Error("すべてのファイルが既に追加されています"),"file-duplicate",{recoveryAction:{message:"既存のファイルをクリアして新しいファイルを追加しますか？",label:"クリアして追加",handler:()=>{this.selectedFiles=[...s],this.updateFileInfo(),e.showToast("success","ファイル更新完了",`${s.length}\u{30D5}\u{30A1}\u{30A4}\u{30EB}\u{3092}\u{8FFD}\u{52A0}\u{3057}\u{307E}\u{3057}\u{305F}`),this.validateSelectedFiles()}}}):a>0?e.showToast("warning","ファイル重複",`${r.length}\u{30D5}\u{30A1}\u{30A4}\u{30EB}\u{3092}\u{8FFD}\u{52A0}\u{3057}\u{307E}\u{3057}\u{305F} (${a}\u{30D5}\u{30A1}\u{30A4}\u{30EB}\u{306F}\u{91CD}\u{8907})`,5e3,3):r.length>0&&e.showToast("success","ファイル追加完了",`${r.length}\u{30D5}\u{30A1}\u{30A4}\u{30EB}\u{3092}\u{8FFD}\u{52A0}\u{3057}\u{307E}\u{3057}\u{305F}`,5e3,2),(r.length>0||this.selectedFiles.length>0)&&await this.validateSelectedFiles()}clearFiles(){this.selectedFiles=[],this.fileInput.value="",this.validFiles=0,this.updateFileInfo();let t=new CustomEvent("filesClear");document.dispatchEvent(t),e.showToast("info","クリア完了","ファイル選択をクリアしました")}async validateSelectedFiles(){if(0===this.selectedFiles.length)return this.updateFileInfo(),!1;try{let e=await t(this.selectedFiles);return this.updateValidationUI(e),this.validFiles=e.filter(e=>e.isValid).length,this.executeButton.disabled=0===this.validFiles,this.validFiles>0}catch(e){return this.handleError(e instanceof Error?e:Error("不明なエラー"),"file-validation"),this.executeButton.disabled=!0,!1}}updateValidationUI(e){this.updateFileInfo(e)}updateFileInfo(e){if(0===this.selectedFiles.length){this.fileInfoArea.innerHTML='<p class="no-file-message">ファイルが選択されていません</p>',this.clearButton.disabled=!0,this.executeButton.disabled=!0;return}let t="";this.selectedFiles.forEach(s=>{let i={status:"pending",messages:[]};if(e){let t=e.find(e=>e.file===s);t&&(i={status:t.isValid?t.warnings.length>0?"warning":"valid":"error",messages:[...t.errors.map(e=>({type:"error",text:e})),...t.warnings.map(e=>({type:"warning",text:e}))]})}let r="",a="";switch(i.status){case"valid":r="status-valid",a="有効";break;case"warning":r="status-warning",a="警告";break;case"error":r="status-error",a="エラー";break;default:r="",a="検証中..."}t+=`
        <div class="file-item">
          <div class="file-icon">\u{1F4C4}</div>
          <div class="file-name">${s.name}</div>
          <div class="file-status ${r}">${a}</div>
        `,i.messages&&i.messages.length>0?(t+='<div class="validation-feedback">',i.messages.forEach(e=>{let s="";switch(e.type){case"error":s="❌";break;case"warning":s="⚠️";break;case"info":s="ℹ️"}t+=`
            <div class="validation-message ${e.type}">
              <span class="validation-icon">${s}</span>
              <span class="validation-text">${e.text}</span>
            </div>
          `}),t+="</div>"):"valid"===i.status&&(t+=`
          <div class="validation-feedback">
            <div class="validation-message success">
              <span class="validation-icon">\u{2705}</span>
              <span class="validation-text">\u{30D5}\u{30A1}\u{30A4}\u{30EB}\u{5F62}\u{5F0F}\u{306F}\u{6709}\u{52B9}\u{3067}\u{3059}</span>
            </div>
          </div>
        `),t+="</div>"}),this.fileInfoArea.innerHTML=t,this.clearButton.disabled=!1}handleError(t,s,i={}){console.error(`\u{30A8}\u{30E9}\u{30FC} (${s}):`,t);let r="エラーが発生しました",a=t.message||"エラーが発生しました",n="";switch(s){case"file-format":r="ファイル形式エラー",n="テキストファイル(.txt)のみ追加できます。ファイル形式を確認してください";break;case"file-validation":r="ファイル検証エラー",n="正しい形式のEF統合ファイルであることを確認してください";break;case"file-duplicate":r="ファイル重複",n="別のファイルを選択するか、既存のファイルをクリアしてください";break;default:n="問題が解決しない場合は、ページを再読み込みしてください"}let o=n?`${a}<br><span class="error-solution">\u{89E3}\u{6C7A}\u{7B56}: ${n}</span>`:a;if(e.showToast("error",r,o,8e3,4),i.recoveryAction&&i.recoveryAction.message&&i.recoveryAction.label&&i.recoveryAction.handler){let t={message:i.recoveryAction.message,label:i.recoveryAction.label,handler:i.recoveryAction.handler};setTimeout(()=>{e.showRecoveryToast(t)},1e3)}i.updateUI&&i.updateUI()}getSelectedFiles(){return this.selectedFiles}getValidFileCount(){return this.validFiles}}let r=null,a={get instance(){return function(){if(!r){if("loading"===document.readyState)throw Error("DOM is not ready. Call this function after DOMContentLoaded");r=new i}return r}()}};class n{constructor(){if(this.currentView="text",this.resultTextarea=document.getElementById("resultTextarea"),this.resultTable=document.getElementById("resultTable"),this.textViewButton=document.getElementById("textViewButton"),this.tableViewButton=document.getElementById("tableViewButton"),this.textResultView=document.getElementById("textResultView"),this.tableResultView=document.getElementById("tableResultView"),this.copyButton=document.getElementById("copyButton"),this.copyMessage=document.getElementById("copyMessage"),this.downloadLink=document.getElementById("downloadLink"),!this.resultTextarea||!this.resultTable||!this.textViewButton||!this.tableViewButton||!this.textResultView||!this.tableResultView||!this.copyButton||!this.copyMessage||!this.downloadLink)throw Error("必要なDOM要素が見つかりません");this.setupEventListeners()}setupEventListeners(){this.textViewButton.addEventListener("click",()=>{this.setResultView("text")}),this.tableViewButton.addEventListener("click",()=>{this.setResultView("table")}),this.copyButton.addEventListener("click",()=>{this.copyResultToClipboard()})}setResultView(e){this.currentView=e,"text"===e?(this.textResultView.style.display="block",this.tableResultView.style.display="none",this.textViewButton.classList.add("active"),this.tableViewButton.classList.remove("active"),this.textViewButton.setAttribute("aria-pressed","true"),this.tableViewButton.setAttribute("aria-pressed","false")):(this.textResultView.style.display="none",this.tableResultView.style.display="block",this.textViewButton.classList.remove("active"),this.tableViewButton.classList.add("active"),this.textViewButton.setAttribute("aria-pressed","false"),this.tableViewButton.setAttribute("aria-pressed","true"))}async copyResultToClipboard(){let e=this.resultTextarea.value;if(e)try{await navigator.clipboard.writeText(e),this.copyMessage.classList.remove("visible","error"),this.copyMessage.textContent="コピーしました！",this.copyMessage.classList.add("visible"),setTimeout(()=>{this.copyMessage.classList.remove("visible")},2e3)}catch(e){console.error("クリップボードへのコピーに失敗しました:",e),this.copyMessage.classList.remove("visible","error"),this.copyMessage.textContent="コピーに失敗しました",this.copyMessage.classList.add("visible"),this.copyMessage.classList.add("error"),setTimeout(()=>{this.copyMessage.classList.remove("visible"),this.copyMessage.classList.remove("error")},3e3)}}displayResult(e,t){let s=t?`=== \u{30C7}\u{30D0}\u{30C3}\u{30B0}\u{60C5}\u{5831} ===
${t}

=== \u{51E6}\u{7406}\u{7D50}\u{679C} ===
${e}`:e;this.resultTextarea.value=s,this.updateResultTable(e);let i=document.getElementById("resultContainer");i&&i.classList.remove("hidden"),this.updateDownloadLink(e);let r=!!e;this.copyButton.disabled=!r,this.downloadLink.classList.toggle("hidden",!r),r||this.clearResultTable()}clearResultTable(){let e=this.resultTable.querySelector("tbody");e&&(e.innerHTML="")}updateResultTable(e){if(!e)return;let t=this.resultTable.querySelector("tbody");if(!t)return;this.clearResultTable();let s=e.trim().split("\n");for(let e=1;e<s.length;e++){let i=s[e].split("	");if(i.length>=5){let e=document.createElement("tr");for(let t=0;t<5;t++){let s=document.createElement("td");s.textContent=i[t],3===t&&("Yes"===i[t]?s.classList.add("eligible-yes"):s.classList.add("eligible-no")),e.appendChild(s)}t.appendChild(e)}}}updateDownloadLink(e){let t=new Blob([e],{type:"text/plain"}),s=URL.createObjectURL(t);this.downloadLink.href&&URL.revokeObjectURL(this.downloadLink.href),this.downloadLink.href=s;let i=new Date,r=`${i.getFullYear()}${(i.getMonth()+1).toString().padStart(2,"0")}${i.getDate().toString().padStart(2,"0")}`;this.downloadLink.setAttribute("download",`\u{77ED}\u{624B}3\u{5224}\u{5B9A}\u{7D50}\u{679C}_${r}.txt`),this.downloadLink.classList.remove("hidden")}getCurrentView(){return this.currentView}getOutputSettings(){let e=document.getElementById("eligibleOnly"),t=document.querySelectorAll('input[name="dateFormat"]'),s="yyyymmdd";for(let e of Array.from(t))if(e.checked){s=e.value;break}return{outputMode:e?.checked?"eligibleOnly":"allCases",dateFormat:s}}}let o="データ識別番号	入院年月日	退院年月日	短手３対象症例	理由",l=["150285010","150183410"],u={0x98cbd8e:"終夜睡眠ポリグラフィー（１及び２以外の場合）（安全精度管理下で行うもの）",0x98cbdf2:"終夜睡眠ポリグラフィー（１及び２以外の場合）（その他のもの）",0x98c3346:"反復睡眠潜時試験（ＭＳＬＴ）",0x98b3b9e:"下垂体前葉負荷試験成長ホルモン（ＧＨ）（一連として）",0x98c28ba:"小児食物アレルギー負荷検査",0x98ae73e:"前立腺針生検法（その他のもの）",0x8f63026:"経皮的放射線治療用金属マーカー留置術",0x8f0fdae:"四肢・躯幹軟部腫瘍摘出術（手）",0x8f5511a:"骨折観血的手術（手舟状骨）",0x8f122ca:"骨内異物（挿入物を含む。）除去術（前腕）",0x8f12392:"骨内異物（挿入物を含む。）除去術（鎖骨）",0x8f1245a:"骨内異物（挿入物を含む。）除去術（手）",0x8f171b2:"ガングリオン摘出術（手）",0x8f59c7e:"関節鏡下手根管開放手術",0x8f4ff12:"胸腔鏡下交感神経節切除術（両側）",0x8f63f62:"涙管チューブ挿入術（涙道内視鏡を用いるもの）",0x8f63fc6:"眼瞼内反症手術（皮膚切開法）",0x8f2055a:"眼瞼下垂症手術（眼瞼挙筋前転法）",0x8f20622:"眼瞼下垂症手術（その他のもの）",0x8f20ad2:"翼状片手術（弁の移植を要するもの）",0x8f21752:"斜視手術（後転法）",0x8f217b6:"斜視手術（前転法及び後転法の併施）",0x8f6133e:"治療的角膜切除術（エキシマレーザーによるもの（角膜ジストロフィー又は帯状角膜変性に係るものに限る。））",0x8f6d90e:"緑内障手術（水晶体再建術併用眼内ドレーン挿入術）",0x8f4add2:"水晶体再建術（眼内レンズを挿入する場合）（その他のもの）",0x8f5a25a:"水晶体再建術（眼内レンズを挿入しない場合）",0x8f2488a:"鼓膜形成手術",0x8f24f2e:"鼻骨骨折整復固定術",0x8f5a386:"声帯ポリープ切除術（ファイバースコープによるもの）",0x8f5a3ea:"声帯ポリープ切除術（直達喉頭鏡によるもの）",0x8f272e2:"喉頭ポリープ切除術（直達喉頭鏡によるもの）",0x8f5633a:"喉頭ポリープ切除術（ファイバースコープによるもの）",0x8f2aa96:"乳腺腫瘍摘出術（長径５センチメートル未満）",0x8f2aafa:"乳腺腫瘍摘出術（長径５センチメートル以上）",0x8f72ce2:"経皮的シャント拡張術・血栓除去術（初回）",0x8f72d46:"経皮的シャント拡張術・血栓除去術（１の実施後３月以内に実施する場合）",0x8f32b1a:"下肢静脈瘤手術（抜去切除術）",0x8f4d672:"下肢静脈瘤手術（硬化療法（一連として））",0x8f557be:"下肢静脈瘤手術（高位結紮術）",0x8f32ba6:"大伏在静脈抜去術",0x8f6534e:"下肢静脈瘤血管内焼灼術",0x8f7178e:"下肢静脈瘤血管内塞栓術",0x8f33ea2:"ヘルニア手術（鼠径ヘルニア）",0x8f4d73a:"腹腔鏡下鼠径ヘルニア手術（両側）",0x8f52ad2:"内視鏡的大腸ポリープ・粘膜切除術（長径２センチメートル未満）",0x8f39df2:"内視鏡的大腸ポリープ・粘膜切除術（長径２センチメートル以上）",0x8f5c8a2:"痔核手術（脱肛を含む。）（硬化療法（四段階注射法によるもの））",0x8f3b8e6:"肛門ポリープ切除術",0x8f3b94a:"肛門尖圭コンジローム切除術",0x8f3c94e:"体外衝撃波腎・尿管結石破砕術（一連につき）",0x8f73e76:"尿失禁手術（ボツリヌス毒素によるもの）",0x8f6fcd6:"顕微鏡下精索静脈瘤手術",0x8f41f3e:"子宮頸部（腟部）切除術",0x8f73f3e:"子宮鏡下有茎粘膜下筋腫切出術（電解質溶液利用のもの）",0x8f73fa2:"子宮内膜ポリープ切除術（電解質溶液利用のもの）",0x8f74006:"子宮鏡下有茎粘膜下筋腫切出術（その他のもの）",0x8f7406a:"子宮内膜ポリープ切除術（その他のもの）",0x8f740ce:"子宮鏡下子宮筋腫摘出術（電解質溶液利用のもの）",0x8f74132:"子宮鏡下子宮筋腫摘出術（その他のもの）",0x8f6679e:"腹腔鏡下卵管形成術",0xabadede:"ガンマナイフによる定位放射線治療"},c=Object.keys(u),d=["150429570","150437170"],h={UNDISCHARGED:"退院日未確定",NO_TARGET_PROCEDURE:"対象手術等なし",HOSPITAL_DAYS_EXCEEDED:"入院期間が６日以上",MULTIPLE_TARGET_PROCEDURES:"対象手術等を２以上実施",OTHER_SURGERY:"対象手術等以外の手術あり",SPECIAL_ADDITION:"内視鏡的大腸ポリープ術に特定加算あり"};function m(e){if(!e||"00000000"===e)return null;try{let t=parseInt(e.substring(0,4),10),s=parseInt(e.substring(4,6),10)-1,i=parseInt(e.substring(6,8),10),r=new Date(t,s,i);if(isNaN(r.getTime()))return null;return r}catch(t){return console.error(`\u{65E5}\u{4ED8}\u{306E}\u{89E3}\u{6790}\u{4E2D}\u{306B}\u{30A8}\u{30E9}\u{30FC}\u{304C}\u{767A}\u{751F}\u{3057}\u{307E}\u{3057}\u{305F}: ${e} - ${t instanceof Error?t.message:String(t)}`),null}}function f(e,t="yyyymmdd"){if("00000000"===e)return e;let s=m(e);if(!s)return e;let i=s.getFullYear(),r=s.getMonth()+1,a=s.getDate();return"yyyy/mm/dd"===t?`${i}/${r.toString().padStart(2,"0")}/${a.toString().padStart(2,"0")}`:`${i}${r.toString().padStart(2,"0")}${a.toString().padStart(2,"0")}`}let p=new class{async processFiles(e,t){try{if(!e||0===e.length)throw Error("ファイルが選択されていません");let i=[];for(let t of e){let e=await s(t);i.push(e)}let r=[];for(let e of i){let t=function(e){let t=e.split(/\r?\n/),s={};for(let e=1;e<t.length;e++){let i=t[e].trim();if(i)try{let e=i.split("	"),t=function(e){if(e.length<4)return null;let t=e[1].trim();if(!t)return null;let s=e[3].trim(),i=e[2].trim();if("000"===(e.length>6?e[6].trim():null))return null;let r={dataId:t,admission:s,discharge:i},a=e.length>8?e[8].trim():null,n=e.length>10?e[10].trim():null;return a&&c.includes(a)?{...r,procedure:a,procedureName:n??"(名称なし)"}:{...r,procedure:null,procedureName:null}}(e);if(t){let{dataId:e,discharge:i,admission:r,procedure:a,procedureName:n}=t,o=s[e];o||(o={id:e,admission:r,discharge:i,procedures:[],procedureNames:[]},s[e]=o),i&&"00000000"!==i&&(!o.discharge||"00000000"===o.discharge||i>o.discharge)&&(o.discharge=i),a&&!o.procedures.includes(a)&&(o.procedures.push(a),o.procedureNames||(o.procedureNames=[]),o.procedureNames.push(n??"(名称なし)"))}}catch{continue}}return Object.values(s)}(e);r=function(e,t){let s={};for(let t of e)s[t.id]={...t,procedures:Array.isArray(t.procedures)?[...t.procedures]:[],procedureNames:Array.isArray(t.procedureNames)?[...t.procedureNames]:[]};for(let e of t){var i,r,a;s[e.id]?(i=s[e.id],r=e,"00000000"!==r.discharge&&(i.discharge=r.discharge),Array.isArray(i.procedures)||(i.procedures=[]),Array.isArray(i.procedureNames)||(i.procedureNames=[]),function(e,t){let s=Array.isArray(t.procedures)?t.procedures:[],i=Array.isArray(t.procedureNames)?t.procedureNames:[];for(let t=0;t<s.length;t++){let r=s[t];e.procedures.includes(r)||(e.procedures.push(r),e.procedureNames||(e.procedureNames=[]),e.procedureNames.push(i[t]??"(名称なし)"))}}(i,r)):s[e.id]={...a=e,procedures:Array.isArray(a.procedures)?[...a.procedures]:[],procedureNames:Array.isArray(a.procedureNames)?[...a.procedureNames]:[]}}return Object.values(s)}(r,t)}let a=r.map(e=>{try{let t={...e};if(!e.discharge||"00000000"===e.discharge)return t.isEligible=!1,t.reason=h.UNDISCHARGED,t;let s=e.procedures.filter(e=>c.includes(e));if(0===s.length)return t.isEligible=!1,t.reason=h.NO_TARGET_PROCEDURE,t;let i=function(e,t){let s=m(e),i=m(t);return s&&i?Math.round((i.getTime()-s.getTime())/864e5)+1:null}(e.admission,e.discharge);if(null===i||i>5)return t.isEligible=!1,t.reason=h.HOSPITAL_DAYS_EXCEEDED,t;if(s.length>1&&new Set(s).size>1)return t.isEligible=!1,t.reason=h.MULTIPLE_TARGET_PROCEDURES,t;if(e.procedures.filter((t,s)=>!(c.includes(t)||!t.startsWith("15")||e.procedureNames&&e.procedureNames[s]&&e.procedureNames[s].includes("加算")||t.startsWith("1500")&&"00"===t.substring(4,6))).length>0)return t.isEligible=!1,t.reason=h.OTHER_SURGERY,t;let r=e.procedures.some(e=>l.includes(e)),a=e.procedures.some(e=>d.includes(e));if(r&&a)return t.isEligible=!1,t.reason=h.SPECIAL_ADDITION,t;return t.isEligible=!0,t.reason=u[s[0]]||"対象手術等",t}catch(t){return console.error(`\u{75C7}\u{4F8B} ${e.id} \u{306E}\u{8A55}\u{4FA1}\u{4E2D}\u{306B}\u{30A8}\u{30E9}\u{30FC}\u{304C}\u{767A}\u{751F}\u{3057}\u{307E}\u{3057}\u{305F}: ${t instanceof Error?t.message:String(t)}`),{...e,isEligible:!1,reason:`\u{8A55}\u{4FA1}\u{30A8}\u{30E9}\u{30FC}: ${t instanceof Error?t.message:String(t)}`}}}).sort((e,t)=>e.id.localeCompare(t.id));return function(e,t=o,s){let i="allCases"===s.outputMode?e:e.filter(e=>!0===e.isEligible);if(0===i.length)return"該当する症例はありません。";let r=[t];return i.forEach(e=>{let t=f(e.admission,s.dateFormat),i=f(e.discharge,s.dateFormat),a=`${e.id}	${t}	${i}	${e.isEligible?"Yes":"No"}	${e.reason||""}`;r.push(a)}),r.join("\n")}(a,o,t)}catch(e){throw console.error("ファイル処理エラー:",e),e}}};class g{constructor(){this.loadingIndicator=null,this.executeButton=null,this.fileManagerInstance=a.instance,this.resultViewerInstance=new n}init(){this.loadingIndicator=document.getElementById("loadingIndicator"),this.executeButton=document.getElementById("executeButton"),this.setupEventListeners(),document.addEventListener("filesClear",()=>{})}setupEventListeners(){this.executeButton&&this.executeButton.addEventListener("click",()=>{this.processFiles()})}async processFiles(){try{let t=this.fileManagerInstance.getSelectedFiles();if(0===t.length){this.handleError(Error("ファイルが選択されていません"),"no-files",{recoveryAction:{message:"ファイルを選択してください",label:"ファイル選択",handler:()=>{let e=document.getElementById("fileInput");e&&e.click()}}});return}if(this.loadingIndicator&&this.loadingIndicator.classList.add("active"),!await this.fileManagerInstance.validateSelectedFiles()){this.loadingIndicator&&this.loadingIndicator.classList.remove("active");return}let s=this.resultViewerInstance.getOutputSettings(),i=await p.processFiles(t,s);this.resultViewerInstance.displayResult(i),e.showToast("success","処理完了","処理が正常に完了しました",5e3,2)}catch(e){this.handleError(e instanceof Error?e:Error("不明なエラー"),"processing",{recoveryAction:{message:"設定を変更して再試行しますか？",label:"再試行",handler:()=>{this.executeButton&&this.executeButton.click()}},updateUI:()=>{}})}finally{this.loadingIndicator&&this.loadingIndicator.classList.remove("active")}}handleError(t,s,i={}){console.error(`\u{30A8}\u{30E9}\u{30FC} (${s}):`,t);let r="エラーが発生しました",a=t.message||"エラーが発生しました",n="";switch(s){case"processing":r="処理エラー",n=t.message.includes("メモリ")?"ファイルサイズが大きすぎる可能性があります。小さなファイルに分割して処理してください":"入力データを確認し、再度実行してください";break;case"no-files":r="ファイル未選択",a="ファイルが選択されていません",n="ファイルを選択してから処理を実行してください";break;default:n="問題が解決しない場合は、ページを再読み込みしてください"}let o=n?`${a}<br><span class="error-solution">\u{89E3}\u{6C7A}\u{7B56}: ${n}</span>`:a;if(e.showToast("error",r,o,8e3,4),i.recoveryAction&&i.recoveryAction.message&&i.recoveryAction.label&&i.recoveryAction.handler){let t={message:i.recoveryAction.message,label:i.recoveryAction.label,handler:i.recoveryAction.handler};setTimeout(()=>{e.showRecoveryToast(t)},1e3)}i.updateUI&&i.updateUI()}}document.addEventListener("DOMContentLoaded",()=>{try{new g().init()}catch(t){console.error("初期化エラー:",t);let e=document.createElement("div");e.className="initialization-error",e.textContent="初期化中にエラーが発生しました。ページを再読み込みしてください。",document.body.prepend(e)}})})();
//# sourceMappingURL=main.js.map
