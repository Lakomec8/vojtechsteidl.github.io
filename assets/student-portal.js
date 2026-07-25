(async function(){
  const loader=document.getElementById("loader");
  const app=document.getElementById("app");
  const token=sessionStorage.getItem("student_token");
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
  const attr=esc;
  const empty=message=>'<div class="empty">'+esc(message)+'</div>';
  const formatDate=value=>{if(!value)return "";const date=new Date(value+"T00:00:00");return Number.isNaN(date.getTime())?String(value):new Intl.DateTimeFormat("cs-CZ",{day:"numeric",month:"numeric",year:"numeric"}).format(date);};
  const shortDate=value=>{if(!value)return "–";const date=new Date(value+"T00:00:00");return Number.isNaN(date.getTime())?String(value):new Intl.DateTimeFormat("cs-CZ",{day:"numeric",month:"numeric"}).format(date);};
  const showError=message=>{document.body.innerHTML='<main class="error"><h1>Studentský portál není dostupný</h1><p>'+esc(message)+'</p><a href="index.html">Zpět na hlavní stránku</a></main>';};
  const openView=id=>{document.querySelectorAll("[data-view]").forEach(button=>button.classList.toggle("active",button.dataset.view===id));document.querySelectorAll(".view").forEach(view=>view.classList.toggle("active",view.id===id));window.scrollTo({top:0,behavior:"smooth"});};

  try{
    if(!token)throw new Error("Nejdřív se prosím přihlas na hlavní stránce.");
    const response=await fetch("students/"+encodeURIComponent(token)+".json?ts="+Date.now(),{cache:"no-store"});
    if(!response.ok)throw new Error("Účet se nepodařilo načíst. Vrať se na hlavní stránku a přihlas se znovu.");
    const data=await response.json();
    const lessons=Array.isArray(data.lessons)?data.lessons:[];
    const materials=Array.isArray(data.materials)?data.materials:[];
    const tasks=Array.isArray(data.tasks)?data.tasks:[];
    const upcoming=Array.isArray(data.upcoming)?data.upcoming:[];
    const timeline=Array.isArray(data.timeline)?data.timeline:[];
    const links=Array.isArray(data.links)?data.links:[];
    const storageKey="student-portal:"+token+":";
    const completed=JSON.parse(localStorage.getItem(storageKey+"tasks")||"{}");

    document.title="Studentský portál | "+(data.studentName||"Student");
    document.getElementById("name").textContent=data.studentName||"Student";
    document.getElementById("initials").textContent=data.studentInitials||"S";
    document.getElementById("priorityTitle").textContent=data.priority?.title||"Vše důležité pro výuku na jednom místě.";
    document.getElementById("priorityText").textContent=data.priority?.text||data.progressText||"";
    document.getElementById("priorityDeadline").textContent=data.priority?.deadline||"";

    const scoredLessons=lessons.filter(lesson=>Number.isFinite(Number(lesson.score)));
    const averageScore=scoredLessons.length?scoredLessons.reduce((sum,lesson)=>sum+Number(lesson.score),0)/scoredLessons.length:null;
    const readinessConfig=data.readiness||{};
    const calculateReadiness=()=>{
      const completedCount=tasks.filter(task=>completed[task.id]).length;
      const taskRatio=tasks.length?completedCount/tasks.length:0;
      let readiness;
      if(averageScore!==null&&tasks.length){
        const lessonWeight=Number(readinessConfig.lessonWeight??60);
        const taskWeight=Number(readinessConfig.taskWeight??40);
        readiness=Math.round((averageScore*10)*(lessonWeight/100)+(taskRatio*100)*(taskWeight/100));
      }else if(averageScore!==null){readiness=Math.round(averageScore*10);
      }else if(tasks.length){readiness=Math.round(taskRatio*100);
      }else{readiness=Math.round(Number(data.progress)||0);}
      return Math.max(0,Math.min(100,readiness));
    };

    const renderNextAction=()=>{
      const activeTask=tasks.find(task=>!completed[task.id]);
      document.getElementById("nextAction").innerHTML=activeTask?'<div class="item"><div class="item-main"><h3>'+esc(activeTask.title)+'</h3><p>'+esc(activeTask.meta)+'</p></div><span class="badge">Priorita</span></div>':empty(tasks.length?"Všechny zadané úkoly jsou dokončené.":"Momentálně není potřeba nic dokončit.");
    };

    const updateSummary=()=>{
      const completedCount=tasks.filter(task=>completed[task.id]).length;
      const activeTasks=Math.max(0,tasks.length-completedCount);
      const readiness=calculateReadiness();
      document.getElementById("readinessLabel").textContent=readinessConfig.label||"Studijní postup";
      document.getElementById("readinessValue").textContent=readiness+" %";
      document.getElementById("readinessFill").style.width=readiness+"%";
      const scorePart=averageScore!==null?"Hodiny "+averageScore.toFixed(1).replace(".0","")+"/10":"Bez hodnocení hodin";
      const taskPart=tasks.length?(completedCount+" z "+tasks.length+" úkolů hotovo"):"Bez aktivních úkolů";
      document.getElementById("readinessCopy").textContent=scorePart+" · "+taskPart;
      document.getElementById("activeCount").textContent=activeTasks;
      document.getElementById("taskMetricCopy").textContent=tasks.length?(activeTasks?activeTasks+" zbývá dokončit":"Všechny úkoly dokončeny"):"Žádný aktivní úkol";
      renderNextAction();
    };

    document.getElementById("lessonCount").textContent=lessons.length;
    const lastLesson=lessons[0]||null;
    document.getElementById("lastLessonDate").textContent=lastLesson?"Poslední: "+shortDate(lastLesson.date):"Zatím bez záznamu";
    document.getElementById("overallScore").textContent=averageScore!==null?averageScore.toFixed(1).replace(".0","")+"/10":"–";
    document.getElementById("overallScoreCopy").textContent=averageScore!==null?(averageScore>=7?"Dobře zvládnuto":averageScore>=4?"Částečně zvládnuto":"Potřebuje procvičit"):"Zatím bez hodnocení";
    const deadline=data.deadline||{};
    const nextEvent=upcoming.find(row=>row&&row.date)||null;
    const nextEventDate=nextEvent?.date||data.nextLesson?.dateISO||deadline.date;
    document.getElementById("nextDate").textContent=shortDate(nextEventDate);
    document.getElementById("nextDateCopy").textContent=nextEvent?.title||data.nextLesson?.topic||deadline.label||"Termín není uveden";

    const materialButtons=material=>{const url=attr(material.url||"#");return '<div class="actions"><a class="secondary" href="'+url+'" target="_blank" rel="noopener">Otevřít</a><a class="download" href="'+url+'" download>Stáhnout PDF</a></div>';};
    const renderMaterials=list=>list.length?list.map(material=>'<div class="item" data-searchable="'+attr([material.title,material.meta,material.badge].join(" ").toLocaleLowerCase("cs"))+'"><div class="item-main"><h3>'+esc(material.title)+'</h3><p>'+esc(material.meta)+'</p>'+materialButtons(material)+'</div><span class="badge">'+esc(material.badge||"Soubor")+'</span></div>').join(""):empty("Zatím tu nejsou žádné materiály.");
    document.getElementById("materialsList").innerHTML=renderMaterials(materials);

    const renderLesson=lesson=>{
      const topics=Array.isArray(lesson.topics)?lesson.topics:[];
      const material=lesson.material||{};
      const score=Number.isFinite(Number(lesson.score))?Number(lesson.score):null;
      const searchable=[lesson.title,lesson.subject,lesson.summary,lesson.improvement,lesson.homework,...topics].join(" ").toLocaleLowerCase("cs");
      return '<div data-searchable="'+attr(searchable)+'"><div class="lesson-summary"><div class="lesson-date">'+esc(lesson.displayDate||formatDate(lesson.date))+'</div><div><div class="lesson-title">'+esc(lesson.title||"Výuková hodina")+'</div><div class="lesson-date">'+esc([lesson.subject,lesson.subtitle].filter(Boolean).join(" · "))+'</div></div>'+(score!==null?'<div class="lesson-score"><strong>'+score+'/10</strong><small>'+esc(lesson.scoreLabel||"Hodnocení")+'</small></div>':"")+'</div><details class="lesson-detail"><summary>Zobrazit detail hodiny</summary><div class="lesson-body"><div><h3>Co se probíralo</h3>'+(topics.length?'<ul>'+topics.map(topic=>'<li>'+esc(topic)+'</li>').join("")+'</ul>':'<p>'+esc(lesson.summary||"Záznam není doplněn.")+'</p>')+'</div><div><h3>Hodnocení</h3><div class="note"><strong>'+(score!==null?score+'/10 — ':"")+esc(lesson.scoreLabel||"Průběžné hodnocení")+'</strong><br>'+esc(lesson.improvement||"Bez dalšího doporučení.")+'</div></div></div><div class="lesson-body"><div><h3>Domácí úkol</h3><p>'+esc(lesson.homework||"Bez domácího úkolu.")+'</p></div><div><h3>Materiál k hodině</h3><p>'+esc(material.title||"Materiál není přiložen.")+'</p>'+(material.url?materialButtons(material):"")+'</div></div></details></div>';
    };
    document.getElementById("historyList").innerHTML=lessons.length?lessons.map(renderLesson).join(""):empty("Zatím tu není žádná absolvovaná hodina.");

    if(lastLesson){
      const lastMaterial=lastLesson.material||{};
      document.getElementById("lastLesson").innerHTML='<div class="item"><div class="item-main"><h3>'+esc(lastLesson.title)+'</h3><p>'+esc((lastLesson.displayDate||formatDate(lastLesson.date))+(lastLesson.score!=null?" · zvládnutí "+lastLesson.score+"/10":"")+(lastLesson.improvement?" · "+lastLesson.improvement:""))+'</p></div>'+(lastLesson.score!=null?'<span class="badge good">'+esc(lastLesson.score)+'/10</span>':"")+'</div><div class="actions"><button class="primary" data-open="history">Detail hodiny</button>'+(lastMaterial.url?'<a class="download" href="'+attr(lastMaterial.url)+'" download>Stáhnout PDF</a>':"")+'</div>';
    }else{document.getElementById("lastLesson").innerHTML=empty("Zatím tu není žádná absolvovaná hodina.");}

    const renderTasks=()=>{document.getElementById("tasksList").innerHTML=tasks.length?tasks.map(task=>'<div class="item task '+(completed[task.id]?"done":"")+'" data-task="'+attr(task.id)+'" data-searchable="'+attr([task.title,task.meta].join(" ").toLocaleLowerCase("cs"))+'" role="button" tabindex="0" aria-pressed="'+String(Boolean(completed[task.id]))+'"><span class="check">✓</span><div class="item-main"><h3>'+esc(task.title)+'</h3><p>'+esc(task.meta)+'</p></div><span class="badge">'+esc(task.badge||"Úkol")+'</span></div>').join(""):empty("Zatím tu nejsou žádné úkoly.");};
    renderTasks();
    document.getElementById("tasksList").addEventListener("click",event=>{const task=event.target.closest("[data-task]");if(!task)return;const id=task.dataset.task;completed[id]=!completed[id];localStorage.setItem(storageKey+"tasks",JSON.stringify(completed));renderTasks();updateSummary();});
    document.getElementById("tasksList").addEventListener("keydown",event=>{if(event.key!=="Enter"&&event.key!==" ")return;const task=event.target.closest("[data-task]");if(!task)return;event.preventDefault();task.click();});

    if(averageScore!==null&&tasks.length){const lessonWeight=Number(readinessConfig.lessonWeight??60);const taskWeight=Number(readinessConfig.taskWeight??40);const formula=document.getElementById("formula");formula.hidden=false;formula.innerHTML="<strong>Jak se počítá připravenost:</strong> hodnocení hodin tvoří "+lessonWeight+" % výsledku a dokončení úkolů "+taskWeight+" %.";}

    document.getElementById("upcomingList").innerHTML=upcoming.length?upcoming.map(row=>'<div class="item" data-searchable="'+attr([row.title,row.meta].join(" ").toLocaleLowerCase("cs"))+'"><div class="item-main"><h3>'+esc(row.title)+'</h3><p>'+esc(row.meta)+'</p></div><span class="badge">'+esc(row.badge||"Termín")+'</span></div>').join(""):empty("Zatím nejsou žádné další termíny.");
    document.getElementById("timelineList").innerHTML=timeline.length?timeline.map(row=>'<div class="item" data-searchable="'+attr([row.title,row.desc,row.month,row.day].join(" ").toLocaleLowerCase("cs"))+'"><div class="item-main"><h3>'+esc([row.month,row.day,row.title].filter(Boolean).join(" · "))+'</h3><p>'+esc(row.desc)+'</p></div><span class="badge">'+esc(row.badge||"Historie")+'</span></div>').join(""):empty("Zatím tu není žádná historie.");
    document.getElementById("linksList").innerHTML=links.length?links.map(link=>'<div class="item" data-searchable="'+attr([link.title,link.desc].join(" ").toLocaleLowerCase("cs"))+'"><div class="item-main"><h3>'+esc(link.title)+'</h3><p>'+esc(link.desc)+'</p><div class="actions"><a class="secondary" href="'+attr(link.url||"#")+'" target="_blank" rel="noopener">Otevřít odkaz</a></div></div></div>').join(""):empty("Zatím tu nejsou žádné odkazy.");

    document.querySelectorAll("[data-view]").forEach(button=>button.addEventListener("click",()=>openView(button.dataset.view)));
    document.querySelectorAll("[data-open]").forEach(button=>button.addEventListener("click",()=>openView(button.dataset.open)));
    document.getElementById("search").addEventListener("input",event=>{const query=event.target.value.trim().toLocaleLowerCase("cs");document.querySelectorAll("[data-searchable]").forEach(row=>{row.hidden=Boolean(query)&&!row.dataset.searchable.includes(query);});});
    document.getElementById("logout").addEventListener("click",()=>{sessionStorage.removeItem("student_token");window.location.href="index.html";});

    updateSummary();
    app.hidden=false;
  }catch(error){showError(error.message||"Došlo k neočekávané chybě.");
  }finally{loader.classList.add("hidden");}
})();