(()=>{let t=new class{constructor(t="toastContainer"){this.activeToasts=[],this.toastHistory=[],this.MAX_VISIBLE_TOASTS=3,this.MAX_HISTORY_ITEMS=10,this.handleHistoryEscKey=t=>{"Escape"===t.key&&this.closeNotificationHistory()},this.toastContainer=document.getElementById(t)||this.createToastContainer(t),this.setupHistoryButton()}createToastContainer(t){let e=document.createElement("div");return e.id=t,e.className="toast-container",document.body.appendChild(e),e}setupHistoryButton(){let t=document.getElementById("notificationHistoryButton");t||((t=document.createElement("button")).id="notificationHistoryButton",t.className="notification-history-button hidden",t.setAttribute("aria-label","通知履歴を表示"),t.innerHTML='<span class="history-icon">\uD83D\uDD14</span>',document.body.appendChild(t),t.addEventListener("click",()=>this.showNotificationHistory()))}showToast(t,e,s,i=5e3,a=3){let r=Date.now(),o={id:"toast-"+r,type:t,title:e,message:s,timestamp:r,priority:a,duration:i};this.addToastToHistory(o),this.activeToasts.push(o),this.activeToasts.sort((t,e)=>t.priority!==e.priority?e.priority-t.priority:e.timestamp-t.timestamp),this.manageActiveToasts(),this.renderToast(o)}addToastToHistory(t){this.toastHistory.unshift({type:t.type,title:t.title,message:t.message,timestamp:t.timestamp}),this.toastHistory.length>this.MAX_HISTORY_ITEMS&&(this.toastHistory=this.toastHistory.slice(0,this.MAX_HISTORY_ITEMS)),this.updateHistoryButton()}updateHistoryButton(){let t=document.getElementById("notificationHistoryButton");t&&this.toastHistory.length>0&&(t.classList.remove("hidden"),t.setAttribute("data-count",this.toastHistory.length.toString()))}manageActiveToasts(){if(this.activeToasts.length>this.MAX_VISIBLE_TOASTS){let t=this.activeToasts.slice(0,this.MAX_VISIBLE_TOASTS),e=this.activeToasts.slice(this.MAX_VISIBLE_TOASTS);if(e.forEach(t=>{t.element&&this.removeToastElement(t.id)}),e.length>1){let t=this.getHighestPriorityType(e);this.showAggregateToast(e.length,t)}this.activeToasts=t}}getHighestPriorityType(t){let e={error:4,warning:3,info:2,success:1},s="info";return t.forEach(t=>{e[t.type]>e[s]&&(s=t.type)}),s}showAggregateToast(t,e){let s="toast-aggregate",i=document.getElementById(s);i&&i.parentNode?.removeChild(i);let a=document.createElement("div");a.id=s,a.className=`toast toast-${e}`,a.setAttribute("role","status"),a.setAttribute("aria-live","polite");let r="";switch(e){case"success":r="✅";break;case"warning":r="⚠️";break;case"error":r="❌";break;case"info":r="ℹ️"}a.innerHTML=`
      <div class="toast-icon">${r}</div>
      <div class="toast-content">
        <h3 class="toast-title">\u{305D}\u{306E}\u{4ED6}\u{306E}\u{901A}\u{77E5}</h3>
        <p class="toast-message">\u{4ED6}\u{306B}${t}\u{4EF6}\u{306E}\u{901A}\u{77E5}\u{304C}\u{3042}\u{308A}\u{307E}\u{3059}</p>
      </div>
      <button class="toast-view-all" aria-label="\u{3059}\u{3079}\u{3066}\u{306E}\u{901A}\u{77E5}\u{3092}\u{8868}\u{793A}">\u{8868}\u{793A}</button>
    `,this.toastContainer.appendChild(a);let o=a.querySelector(".toast-view-all");o?.addEventListener("click",()=>this.showNotificationHistory())}showNotificationHistory(){let t=document.getElementById("notificationHistoryModal");t&&t.parentNode?.removeChild(t);let e=document.createElement("div");e.id="notificationHistoryModal",e.className="notification-history-modal",e.setAttribute("role","dialog"),e.setAttribute("aria-labelledby","notificationHistoryTitle"),e.setAttribute("aria-modal","true");let s="";this.toastHistory.forEach(t=>{if(t.timestamp){let e=new Date(t.timestamp).toLocaleTimeString();s+=`
          <div class="history-item history-item-${t.type}">
            <div class="history-item-time">${e}</div>
            <div class="history-item-content">
              <h4 class="history-item-title">${t.title||""}</h4>
              <p class="history-item-message">${t.message||""}</p>
            </div>
          </div>
        `}}),e.innerHTML=`
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
    `,document.body.appendChild(e),setTimeout(()=>{e.classList.add("active")},10),e.querySelectorAll(".notification-history-close, .notification-history-close-btn").forEach(t=>{t.addEventListener("click",()=>{this.closeNotificationHistory()})});let i=e.querySelector(".notification-history-clear");i?.addEventListener("click",()=>{this.clearNotificationHistory(),this.closeNotificationHistory()}),e.addEventListener("click",t=>{t.target===e&&this.closeNotificationHistory()}),document.addEventListener("keydown",this.handleHistoryEscKey)}closeNotificationHistory(){let t=document.getElementById("notificationHistoryModal");t&&(t.classList.remove("active"),setTimeout(()=>{t.parentNode&&t.parentNode.removeChild(t)},300)),document.removeEventListener("keydown",this.handleHistoryEscKey)}clearNotificationHistory(){this.toastHistory=[],this.updateHistoryButton()}renderToast(t){let e=document.createElement("div");e.id=t.id,e.className=`toast toast-${t.type}`,e.setAttribute("role","alert"),e.setAttribute("aria-live","assertive");let s="";switch(t.type){case"success":s="✅";break;case"warning":s="⚠️";break;case"error":s="❌";break;case"info":s="ℹ️"}e.innerHTML=`
      <div class="toast-icon">${s}</div>
      <div class="toast-content">
        <h3 class="toast-title">${t.title}</h3>
        <p class="toast-message">${t.message}</p>
      </div>
      <button class="toast-close" aria-label="\u{901A}\u{77E5}\u{3092}\u{9589}\u{3058}\u{308B}">\xd7</button>
    `,this.toastContainer.appendChild(e),t.element=e;let i=e.querySelector(".toast-close");i?.addEventListener("click",()=>{this.removeToast(t.id)}),t.duration>0&&setTimeout(()=>{this.removeToast(t.id)},t.duration)}removeToast(t){this.activeToasts=this.activeToasts.filter(e=>e.id!==t),this.removeToastElement(t)}removeToastElement(t){let e=document.getElementById(t);e&&(e.style.opacity="0",e.style.transform="translateX(100%)",setTimeout(()=>{e.parentNode&&e.parentNode.removeChild(e)},300))}showRecoveryToast(t){let e="toast-recovery-"+Date.now(),s=document.createElement("div");s.id=e,s.className="toast toast-info",s.setAttribute("role","alert"),s.setAttribute("aria-live","assertive"),s.innerHTML=`
      <div class="toast-icon">\u{1F504}</div>
      <div class="toast-content">
        <h3 class="toast-title">\u{56DE}\u{5FA9}\u{30A2}\u{30AF}\u{30B7}\u{30E7}\u{30F3}</h3>
        <p class="toast-message">${t.message}</p>
      </div>
      <button class="toast-action" aria-label="${t.label}">${t.label}</button>
      <button class="toast-close" aria-label="\u{901A}\u{77E5}\u{3092}\u{9589}\u{3058}\u{308B}">\xd7</button>
    `,this.toastContainer.appendChild(s);let i=s.querySelector(".toast-action");i?.addEventListener("click",()=>{t.handler(),this.removeToastElement(e)});let a=s.querySelector(".toast-close");a?.addEventListener("click",()=>{this.removeToastElement(e)}),setTimeout(()=>{this.removeToastElement(e)},15e3)}};async function e(t){if(!t||0===t.length)throw Error("ファイルが選択されていません");let e=[];for(let i of t)try{let t=await s(i),a=function(t,e){let s={file:t,isValid:!0,warnings:[],errors:[]};if(!e.trim())return s.isValid=!1,s.errors.push("ファイルが空です"),s;let i=e.split(/\r?\n/).filter(t=>t.trim());if(i.length<2)return s.isValid=!1,s.errors.push("ファイルが空か、データが不足しています"),s;let a=i[0].trim();a||s.warnings.push("ヘッダー行が空です");let r=a.split(/\t/),o=["施設コード","データ識別番号","退院年月日","入院年月日","データ区分"].filter(t=>!r.includes(t));o.length>0&&s.warnings.push(`\u{63A8}\u{5968}\u{30D8}\u{30C3}\u{30C0}\u{30FC}\u{30D5}\u{30A3}\u{30FC}\u{30EB}\u{30C9}\u{304C}\u{4E0D}\u{8DB3}\u{3057}\u{3066}\u{3044}\u{307E}\u{3059}: ${o.join(", ")}`);let n=Math.min(10,i.length-1),l=0,u=!1;for(let t=1;t<=n;t++){let e=i[t].trim();if(!e)continue;let a=e.split(/\t/);if(a.length<10){u||(s.warnings.push(`\u{4E00}\u{90E8}\u{306E}\u{884C}\u{306B}\u{5FC5}\u{8981}\u{306A}\u{5217}\u{6570}\u{FF08}10\u{5217}\u{4EE5}\u{4E0A}\u{FF09}\u{304C}\u{3042}\u{308A}\u{307E}\u{305B}\u{3093}\u{3002}\u{FF08}\u{6700}\u{521D}\u{306E}\u{4F8B}\u{FF1A}\u{884C} ${t+1}, \u{5217}\u{6570}: ${a.length}\u{FF09}`),u=!0);continue}let r=a[1].trim();r&&!(r.length>10)||s.warnings.some(t=>t.includes("データ識別番号"))||s.warnings.push(`\u{4E00}\u{90E8}\u{306E}\u{884C}\u{306E}\u{30C7}\u{30FC}\u{30BF}\u{8B58}\u{5225}\u{756A}\u{53F7}\u{304C}\u{4E0D}\u{9069}\u{5207}\u{3067}\u{3059}\u{FF08}\u{7A7A}\u{307E}\u{305F}\u{306F}10\u{6841}\u{8D85}\u{FF09}\u{3002}\u{FF08}\u{6700}\u{521D}\u{306E}\u{4F8B}\u{FF1A}\u{884C} ${t+1}, \u{5024}: ${r}\u{FF09}`);let o=a[2].trim(),n=a[3].trim(),c=/^(\d{8}|00000000)$/;c.test(n)||(s.isValid=!1,s.errors.push(`\u{5165}\u{9662}\u{5E74}\u{6708}\u{65E5}\u{304C}\u{4E0D}\u{6B63}\u{3067}\u{3059}\u{FF08}\u{884C} ${t+1}, \u{5024}: ${n}\u{FF09}`)),c.test(o)||"00000000"===o||s.warnings.push(`\u{9000}\u{9662}\u{5E74}\u{6708}\u{65E5}\u{306E}\u{5F62}\u{5F0F}\u{304C}\u{4E0D}\u{9069}\u{5207}\u{3067}\u{3059}\u{FF08}\u{884C} ${t+1}, \u{5024}: ${o}\u{FF09}`);let d=a[4].trim();/^\d{1,2}$/.test(d)||s.warnings.some(t=>t.includes("データ区分"))||s.warnings.push(`\u{4E00}\u{90E8}\u{306E}\u{884C}\u{306E}\u{30C7}\u{30FC}\u{30BF}\u{533A}\u{5206}\u{304C}\u{9069}\u{5207}\u{306A}\u{30D5}\u{30A9}\u{30FC}\u{30DE}\u{30C3}\u{30C8}\u{FF08}2\u{6841}\u{4EE5}\u{5185}\u{306E}\u{6570}\u{5B57}\u{FF09}\u{3067}\u{306F}\u{3042}\u{308A}\u{307E}\u{305B}\u{3093}`),l++}return 0===l&&n>0&&(s.isValid=!1,s.errors.push("有効なデータ行が見つかりません")),s}(i,t);e.push(a)}catch(t){e.push({file:i,isValid:!1,warnings:[],errors:[t.message||"不明なエラーが発生しました"]})}return e}function s(t){return new Promise((e,s)=>{let i=new FileReader;i.onload=t=>{"string"==typeof t.target?.result?e(t.target.result):s(Error("Read error: Invalid file format"))},i.onerror=()=>{s(Error("Read error: File read failed"))};try{i.readAsText(t)}catch(t){s(Error("Read error: Cannot start reading file"))}})}class i{constructor(){if(this.selectedFiles=[],this.validFiles=0,this.fileInput=document.getElementById("fileInput"),this.fileInfoArea=document.getElementById("fileInfoArea"),this.clearButton=document.getElementById("clearButton"),this.executeButton=document.getElementById("executeButton"),this.dropArea=document.getElementById("dropArea"),!this.fileInput||!this.fileInfoArea||!this.clearButton||!this.executeButton||!this.dropArea)throw Error("必要なDOM要素が見つかりません");this.setupEventListeners()}setupEventListeners(){let t=document.getElementById("fileSelectButton");t&&t.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),this.fileInput.click()}),this.fileInput.addEventListener("change",()=>{this.processNewFiles(Array.from(this.fileInput.files||[]))}),this.dropArea.addEventListener("dragover",t=>{t.preventDefault(),this.dropArea.classList.add("drag-over")}),this.dropArea.addEventListener("dragleave",t=>{t.preventDefault(),this.dropArea.classList.remove("drag-over")}),this.dropArea.addEventListener("drop",t=>{t.preventDefault(),this.dropArea.classList.remove("drag-over"),t.dataTransfer&&t.dataTransfer.files.length>0&&this.processNewFiles(Array.from(t.dataTransfer.files))}),this.dropArea.addEventListener("keydown",t=>{("Enter"===t.key||" "===t.key)&&(t.preventDefault(),this.fileInput.click())}),this.dropArea.addEventListener("click",t=>{"BUTTON"!==t.target.tagName&&this.fileInput.click()}),this.clearButton.addEventListener("click",()=>{this.clearFiles()})}processNewFiles(e){let s=Array.from(e).filter(t=>"text/plain"===t.type||t.name.endsWith(".txt"));if(s.length<e.length){this.handleError(Error("テキストファイル以外が含まれています"),"file-format");return}let i=Array.from(this.selectedFiles).map(t=>t.name),a=s.filter(t=>!i.includes(t.name)),r=s.length-a.length;a.forEach(t=>this.selectedFiles.push(t)),this.updateFileInfo(),0===a.length?this.handleError(Error("すべてのファイルが既に追加されています"),"file-duplicate",{recoveryAction:{message:"既存のファイルをクリアして新しいファイルを追加しますか？",label:"クリアして追加",handler:()=>{this.selectedFiles=[...s],this.updateFileInfo(),t.showToast("success","ファイル更新完了",`${s.length}\u{30D5}\u{30A1}\u{30A4}\u{30EB}\u{3092}\u{8FFD}\u{52A0}\u{3057}\u{307E}\u{3057}\u{305F}`)}}}):r>0?t.showToast("warning","ファイル重複",`${s.length-r}\u{30D5}\u{30A1}\u{30A4}\u{30EB}\u{3092}\u{8FFD}\u{52A0}\u{3057}\u{307E}\u{3057}\u{305F} (${r}\u{30D5}\u{30A1}\u{30A4}\u{30EB}\u{306F}\u{91CD}\u{8907})`,5e3,3):t.showToast("success","ファイル追加完了",`${s.length}\u{30D5}\u{30A1}\u{30A4}\u{30EB}\u{3092}\u{8FFD}\u{52A0}\u{3057}\u{307E}\u{3057}\u{305F}`,5e3,2),this.validateSelectedFiles()}clearFiles(){this.selectedFiles=[],this.fileInput.value="",this.validFiles=0,this.updateFileInfo();let e=new CustomEvent("filesClear");document.dispatchEvent(e),t.showToast("info","クリア完了","ファイル選択をクリアしました")}async validateSelectedFiles(){if(0===this.selectedFiles.length)return!1;try{let t=await e(this.selectedFiles);return this.updateValidationUI(t),this.validFiles=t.filter(t=>t.isValid).length,this.executeButton.disabled=0===this.validFiles,this.validFiles>0}catch(t){return this.handleError(t instanceof Error?t:Error("不明なエラー"),"file-validation"),!1}}updateValidationUI(t){this.updateFileInfo(t)}updateFileInfo(t){if(0===this.selectedFiles.length){this.fileInfoArea.innerHTML='<p class="no-file-message">ファイルが選択されていません</p>',this.clearButton.disabled=!0,this.executeButton.disabled=!0;return}let e="";this.selectedFiles.forEach(s=>{let i={status:"pending",messages:[]};if(t){let e=t.find(t=>t.file===s);e&&(i={status:e.isValid?e.warnings.length>0?"warning":"valid":"error",messages:[...e.errors.map(t=>({type:"error",text:t})),...e.warnings.map(t=>({type:"warning",text:t}))]})}let a="",r="";switch(i.status){case"valid":a="status-valid",r="有効";break;case"warning":a="status-warning",r="警告";break;case"error":a="status-error",r="エラー";break;default:a="",r="検証中..."}e+=`
        <div class="file-item">
          <div class="file-icon">\u{1F4C4}</div>
          <div class="file-name">${s.name}</div>
          <div class="file-status ${a}">${r}</div>
        `,i.messages&&i.messages.length>0?(e+='<div class="validation-feedback">',i.messages.forEach(t=>{let s="";switch(t.type){case"error":s="❌";break;case"warning":s="⚠️";break;case"info":s="ℹ️"}e+=`
            <div class="validation-message ${t.type}">
              <span class="validation-icon">${s}</span>
              <span class="validation-text">${t.text}</span>
            </div>
          `}),e+="</div>"):"valid"===i.status&&(e+=`
          <div class="validation-feedback">
            <div class="validation-message success">
              <span class="validation-icon">\u{2705}</span>
              <span class="validation-text">\u{30D5}\u{30A1}\u{30A4}\u{30EB}\u{5F62}\u{5F0F}\u{306F}\u{6709}\u{52B9}\u{3067}\u{3059}</span>
            </div>
          </div>
        `),e+="</div>"}),this.fileInfoArea.innerHTML=e,this.clearButton.disabled=!1}handleError(e,s,i={}){console.error(`\u{30A8}\u{30E9}\u{30FC} (${s}):`,e);let a="エラーが発生しました",r=e.message||"エラーが発生しました",o="";switch(s){case"file-format":a="ファイル形式エラー",o="テキストファイル(.txt)のみ追加できます。ファイル形式を確認してください";break;case"file-validation":a="ファイル検証エラー",o="正しい形式のEF統合ファイルであることを確認してください";break;case"file-duplicate":a="ファイル重複",o="別のファイルを選択するか、既存のファイルをクリアしてください";break;default:o="問題が解決しない場合は、ページを再読み込みしてください"}let n=o?`${r}<br><span class="error-solution">\u{89E3}\u{6C7A}\u{7B56}: ${o}</span>`:r;if(t.showToast("error",a,n,8e3,4),i.recoveryAction&&i.recoveryAction.message&&i.recoveryAction.label&&i.recoveryAction.handler){let e={message:i.recoveryAction.message,label:i.recoveryAction.label,handler:i.recoveryAction.handler};setTimeout(()=>{t.showRecoveryToast(e)},1e3)}i.updateUI&&i.updateUI()}getSelectedFiles(){return this.selectedFiles}getValidFileCount(){return this.validFiles}}let a=null,r={get instance(){return function(){if(!a){if("loading"===document.readyState)throw Error("DOM is not ready. Call this function after DOMContentLoaded");a=new i}return a}()}},o=new class{constructor(){if(this.currentView="text",this.resultTextarea=document.getElementById("resultTextarea"),this.resultTable=document.getElementById("resultTable"),this.textViewButton=document.getElementById("textViewButton"),this.tableViewButton=document.getElementById("tableViewButton"),this.textResultView=document.getElementById("textResultView"),this.tableResultView=document.getElementById("tableResultView"),this.copyButton=document.getElementById("copyButton"),this.copyMessage=document.getElementById("copyMessage"),this.downloadLink=document.getElementById("downloadLink"),!this.resultTextarea||!this.resultTable||!this.textViewButton||!this.tableViewButton||!this.textResultView||!this.tableResultView||!this.copyButton||!this.copyMessage||!this.downloadLink)throw Error("必要なDOM要素が見つかりません");this.setupEventListeners()}setupEventListeners(){this.textViewButton.addEventListener("click",()=>{this.setResultView("text")}),this.tableViewButton.addEventListener("click",()=>{this.setResultView("table")}),this.copyButton.addEventListener("click",()=>{this.copyResultToClipboard()})}setResultView(t){this.currentView=t,"text"===t?(this.textResultView.style.display="block",this.tableResultView.style.display="none",this.textViewButton.classList.add("active"),this.tableViewButton.classList.remove("active"),this.textViewButton.setAttribute("aria-pressed","true"),this.tableViewButton.setAttribute("aria-pressed","false")):(this.textResultView.style.display="none",this.tableResultView.style.display="block",this.textViewButton.classList.remove("active"),this.tableViewButton.classList.add("active"),this.textViewButton.setAttribute("aria-pressed","false"),this.tableViewButton.setAttribute("aria-pressed","true"))}copyResultToClipboard(){this.resultTextarea.value&&(this.resultTextarea.select(),document.execCommand("copy"),window.getSelection()?.removeAllRanges(),this.copyMessage.textContent="コピーしました！",this.copyMessage.classList.add("visible"),setTimeout(()=>{this.copyMessage.classList.remove("visible")},2e3))}displayResult(t){if(!t)return;this.resultTextarea.value=t,this.updateResultTable(t);let e=document.getElementById("resultContainer");e&&e.classList.remove("hidden"),this.updateDownloadLink(t)}clearResultTable(){let t=this.resultTable.querySelector("tbody");t&&(t.innerHTML="")}updateResultTable(t){if(!t)return;let e=this.resultTable.querySelector("tbody");if(!e)return;this.clearResultTable();let s=t.trim().split("\n");for(let t=1;t<s.length;t++){let i=s[t].split("	");if(i.length>=5){let t=document.createElement("tr");for(let e=0;e<5;e++){let s=document.createElement("td");s.textContent=i[e],3===e&&("Yes"===i[e]?s.classList.add("eligible-yes"):s.classList.add("eligible-no")),t.appendChild(s)}e.appendChild(t)}}}updateDownloadLink(t){let e=new Blob([t],{type:"text/plain"}),s=URL.createObjectURL(e);this.downloadLink.href&&URL.revokeObjectURL(this.downloadLink.href),this.downloadLink.href=s;let i=new Date,a=`${i.getFullYear()}${(i.getMonth()+1).toString().padStart(2,"0")}${i.getDate().toString().padStart(2,"0")}`;this.downloadLink.setAttribute("download",`\u{77ED}\u{624B}3\u{5224}\u{5B9A}\u{7D50}\u{679C}_${a}.txt`),this.downloadLink.classList.remove("hidden")}getCurrentView(){return this.currentView}getOutputSettings(){let t=document.getElementById("eligibleOnly"),e=document.querySelectorAll('input[name="dateFormat"]'),s="YYYYMMDD";for(let t of Array.from(e))if(t.checked){s=t.value;break}return{outputMode:t?.checked?"eligibleOnly":"allCases",dateFormat:s}}},n=new class{constructor(){this.steps=[],this.currentStep=0;let t=document.querySelectorAll(".step");this.steps=Array.from(t),this.updateStep(0)}updateStep(t){t<0&&(t=0),t>=this.steps.length&&(t=this.steps.length-1);for(let e=0;e<this.steps.length;e++)e<t?(this.steps[e].classList.remove("active"),this.steps[e].classList.add("completed"),this.steps[e].removeAttribute("aria-current")):e===t?(this.steps[e].classList.add("active"),this.steps[e].classList.remove("completed"),this.steps[e].setAttribute("aria-current","step")):(this.steps[e].classList.remove("active","completed"),this.steps[e].removeAttribute("aria-current"));this.currentStep=t;let e=new CustomEvent("stepChange",{detail:{previousStep:this.currentStep,currentStep:t}});document.dispatchEvent(e)}nextStep(){this.currentStep<this.steps.length-1&&this.updateStep(this.currentStep+1)}previousStep(){this.currentStep>0&&this.updateStep(this.currentStep-1)}goToStep(t){this.updateStep(t)}getCurrentStep(){return this.currentStep}getTotalSteps(){return this.steps.length}},l=new class{async processFiles(t){if(!t||0===t.length)throw Error("ファイルが選択されていません");try{let e=[];for(let i of t){let t=await s(i);e.push(t)}let i=[];for(let t of e){let e=this.parseEFFile(t);this.mergeCases(i,e)}let a=this.evaluateCases(i);return this.formatResults(a)}catch(t){throw console.error("ファイル処理エラー:",t),t}}parseEFFile(t){let e=[],s=t.split("\n");for(let t=1;t<s.length;t++){let i=s[t].trim();if(!i)continue;let a=i.split(",");a.length>=4&&e.push({dataId:a[0],patientId:a[1],admissionDate:a[2],dischargeDate:a[3],procedures:a.slice(4),status:"pending"})}return e}mergeCases(t,e){for(let s of e){let e=t.findIndex(t=>t.dataId===s.dataId);if(e>=0){let i=t[e];"00000000"===i.dischargeDate&&"00000000"!==s.dischargeDate&&(t[e]={...i,dischargeDate:s.dischargeDate}),t[e].procedures=[...new Set([...i.procedures,...s.procedures])]}else t.push(s)}return t}evaluateCases(t){return t.map(t=>{if("00000000"===t.dischargeDate)return{...t,status:"pending",isShortStayEligible:!1,eligibilityReason:"退院日未確定"};let e=t.procedures.some(t=>["K123","K456","K789"].includes(t)),s=new Date(parseInt(t.admissionDate.substring(0,4)),parseInt(t.admissionDate.substring(4,6))-1,parseInt(t.admissionDate.substring(6,8))),i=Math.floor((new Date(parseInt(t.dischargeDate.substring(0,4)),parseInt(t.dischargeDate.substring(4,6))-1,parseInt(t.dischargeDate.substring(6,8))).getTime()-s.getTime())/864e5),a=e&&i<=5;return{...t,status:"evaluated",isShortStayEligible:a,eligibilityReason:a?"対象処置あり、5日以内の退院":e?"5日超の入院":"対象処置なし"}})}formatResults(t){let e="データ識別番号	入院年月日	退院年月日	短手３対象症例	判定理由\n";for(let s of[...t].sort((t,e)=>t.dataId.localeCompare(e.dataId)))e+=`${s.dataId}	${s.admissionDate}	${s.dischargeDate}	${s.isShortStayEligible?"Yes":"No"}	${s.eligibilityReason||""}
`;return e}};class u{init(){this.loadingIndicator=document.getElementById("loadingIndicator"),this.executeButton=document.getElementById("executeButton"),this.setupEventListeners(),n.updateStep(0)}setupEventListeners(){this.executeButton&&this.executeButton.addEventListener("click",()=>{this.processFiles()}),document.addEventListener("filesClear",()=>{n.updateStep(0)})}async processFiles(){try{n.updateStep(2);let e=this.fileManagerInstance.getSelectedFiles();if(0===e.length){this.handleError(Error("ファイルが選択されていません"),"no-files",{recoveryAction:{message:"ファイルを選択してください",label:"ファイル選択",handler:()=>{let t=document.getElementById("fileInput");t&&t.click()}}});return}if(this.loadingIndicator&&this.loadingIndicator.classList.add("active"),!await this.fileManagerInstance.validateSelectedFiles()){this.loadingIndicator&&this.loadingIndicator.classList.remove("active"),n.updateStep(1);return}let s=await l.processFiles(e);o.displayResult(s),n.updateStep(3),t.showToast("success","処理完了","処理が正常に完了しました",5e3,2)}catch(t){this.handleError(t instanceof Error?t:Error("不明なエラー"),"processing",{recoveryAction:{message:"設定を変更して再試行しますか？",label:"再試行",handler:()=>{this.executeButton&&this.executeButton.click()}},updateUI:()=>{n.updateStep(1)}})}finally{this.loadingIndicator&&this.loadingIndicator.classList.remove("active")}}handleError(e,s,i={}){console.error(`\u{30A8}\u{30E9}\u{30FC} (${s}):`,e);let a="エラーが発生しました",r=e.message||"エラーが発生しました",o="";switch(s){case"processing":a="処理エラー",o=e.message.includes("メモリ")?"ファイルサイズが大きすぎる可能性があります。小さなファイルに分割して処理してください":"入力データを確認し、再度実行してください";break;case"no-files":a="ファイル未選択",r="ファイルが選択されていません",o="ファイルを選択してから処理を実行してください";break;default:o="問題が解決しない場合は、ページを再読み込みしてください"}let n=o?`${r}<br><span class="error-solution">\u{89E3}\u{6C7A}\u{7B56}: ${o}</span>`:r;if(t.showToast("error",a,n,8e3,4),i.recoveryAction&&i.recoveryAction.message&&i.recoveryAction.label&&i.recoveryAction.handler){let e={message:i.recoveryAction.message,label:i.recoveryAction.label,handler:i.recoveryAction.handler};setTimeout(()=>{t.showRecoveryToast(e)},1e3)}i.updateUI&&i.updateUI()}constructor(){this.loadingIndicator=null,this.executeButton=null,this.fileManagerInstance=r.instance}}document.addEventListener("DOMContentLoaded",()=>{try{new u().init()}catch(e){console.error("初期化エラー:",e);let t=document.createElement("div");t.className="initialization-error",t.textContent="初期化中にエラーが発生しました。ページを再読み込みしてください。",document.body.prepend(t)}})})();
//# sourceMappingURL=main.js.map
