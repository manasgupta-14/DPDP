import TasksBoard from "../../components/user/TasksBoard.jsx";

export default function MyTasks() {
    return (
        <div className="mx-auto max-w-4xl space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div>
                <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">My Tasks</h1>
                <p className="mt-1 text-sm text-ink-3">Review consent requests and notices from your organisation, then allow, deny or mark them as read.</p>
            </div>
            <TasksBoard />
        </div>
    );
}
