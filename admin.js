const SUPABASE_URL="https://xpzufexzbrlddthdvgve.supabase.co",SUPABASE_ANON_KEY="sb_publishable_MVBg7lMChhL52f30zx-JxA_SBL1vSHZ";const sb=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);const $=id=>document.getElementById(id);

async function auth(){
  const {data}=await sb.auth.getSession();
  if(data.session){
    $("loginPanel").classList.add("hidden");
    $("dashboard").classList.remove("hidden");
    $("logout").classList.remove("hidden");
    await loadAdmin();
  }
}

$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  $("loginMsg").textContent="Signing in…";
  const {error}=await sb.auth.signInWithPassword({
    email:$("email").value,
    password:$("password").value
  });
  if(error){$("loginMsg").textContent=error.message;return}
  await auth();
});

$("logout").addEventListener("click",async()=>{
  await sb.auth.signOut();
  location.reload();
});

function cleanArticle(){
  const status=$("status").value==="published"?"published":"draft";
  return {
    title:$("title").value.trim(),
    slug:$("slug").value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/^-|-$/g,""),
    category:$("category").value.trim(),
    status,
    published:status==="published",
    published_at:status==="published"?new Date().toISOString():null,
    excerpt:$("excerpt").value.trim(),
    tags:$("tags").value.split(",").map(x=>x.trim()).filter(Boolean),
    content:$("content").value
  };
}

async function loadAdmin(){
  try{
    const {data,error}=await sb.from("articles").select("*").order("updated_at",{ascending:false});
    if(error)throw error;
    $("adminMsg").textContent="";
    $("articleList").innerHTML=data.length
      ?data.map(a=>'<button class="admin-row" data-id="'+a.id+'"><span><b>'+esc(a.title)+'</b><small>'+esc(a.category)+" · "+esc(a.status)+'</small></span><span>→</span></button>').join("")
      :'<div class="empty">No articles yet. Create the first one.</div>';
    document.querySelectorAll(".admin-row").forEach(x=>x.onclick=()=>edit(data.find(a=>String(a.id)===x.dataset.id)));
  }catch(e){
    $("adminMsg").textContent=e.message||"Could not load articles";
  }
}

function edit(a){
  $("editor").classList.remove("hidden");
  $("articleId").value=a.id;
  $("title").value=a.title;
  $("slug").value=a.slug;
  $("category").value=a.category;
  $("status").value=a.status;
  $("excerpt").value=a.excerpt||"";
  $("tags").value=(a.tags||[]).join(", ");
  $("content").value=a.content||"";
  scrollTo({top:document.body.scrollHeight,behavior:"smooth"});
}

$("newArticle").onclick=()=>{
  $("editor").classList.remove("hidden");
  $("articleId").value="";
  $("title").value="";
  $("slug").value="";
  $("category").value="";
  $("status").value="draft";
  $("excerpt").value="";
  $("tags").value="";
  $("content").value="";
};

$("cancelEdit").onclick=()=>$("editor").classList.add("hidden");

$("editor").addEventListener("submit",async e=>{
  e.preventDefault();
  $("editorMsg").textContent="Saving…";
  try{
    const id=$("articleId").value;
    const body=cleanArticle();
    if(!body.title||!body.slug||!body.content||!body.category)throw Error("Title, slug, category and content are required");

    if(id){
      const {error}=await sb.from("articles").update(body).eq("id",id);
      if(error)throw error;
    }else{
      const {error}=await sb.from("articles").insert(body);
      if(error)throw error;
    }

    $("editorMsg").textContent="Saved ✓";
    await loadAdmin();
  }catch(e){
    $("editorMsg").textContent=e.message||"Save failed";
  }
});

$("deleteArticle").onclick=async()=>{
  const id=$("articleId").value;
  if(!id||!confirm("Delete this article?"))return;
  try{
    const {error}=await sb.from("articles").delete().eq("id",id);
    if(error)throw error;
    $("editor").classList.add("hidden");
    $("editorMsg").textContent="";
    await loadAdmin();
  }catch(e){
    $("editorMsg").textContent=e.message||"Delete failed";
  }
};

function esc(s){
  return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

auth();