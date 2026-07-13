import { Loading } from '../../../components/common/Loading';

export default function PropertyDetailLoading() {
    return (
        <main className="page-shell">
            <Loading label="Đang tải chi tiết bất động sản..." />
        </main>
    );
}
