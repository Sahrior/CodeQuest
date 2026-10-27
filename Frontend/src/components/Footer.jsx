export default function Footer() {
  return (
    <footer>
      <div className="bg-slate-400 px-6 py-10 text-white md:px-20">
        <h4 className="mb-4 text-lg font-bold">Developed By</h4>
        <div className="flex justify-between text-sm">
          <div>
            <p className="font-semibold">Md Sahriar Haider Shovon</p>
            <p>Group Leader</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Al Muqtadir Islam Mahit</p>
            <p>Group Leader</p>
          </div>
        </div>
      </div>
      <div className="bg-slate-900 py-3 text-center text-xs text-slate-300">
        All rights reserved by United International University
      </div>
    </footer>
  );
}