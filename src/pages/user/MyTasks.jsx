import TasksBoard from "../../components/user/TasksBoard.jsx";

export default function MyTasks() {
    return (
        <div className="mx-auto max-w-4xl space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
                <p className="mt-1 text-sm text-[#475569]">Review consent requests and notices from your organisation, then allow, deny or mark them as read.</p>
            </div>
            <TasksBoard />
        </div>
    );
}
