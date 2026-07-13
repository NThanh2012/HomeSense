# Frontend Structure

Frontend nam trong `client/` va dung NextJS App Router.

## Main Folders

- `client/src/app`: route pages.
- `client/src/components/common`: loading, empty, error va shared UI states.
- `client/src/components/properties`: property list/detail UI.
- `client/src/components/dashboard`: user dashboard UI.
- `client/src/components/admin`: admin UI.
- `client/src/components/recommendations`: recommendation UI dung chung.
- `client/src/features`: API wrappers va feature types.
- `client/src/lib`: API client va helpers.
- `client/src/types`: response/pagination/shared types.

## Current Routes

- Public property pages:
    - `/properties`
    - `/properties/[id]`
- Auth:
    - `/auth/login`
    - `/auth/register`
- User dashboard:
    - `/dashboard`
    - `/dashboard/profile`
    - `/dashboard/favorites`
    - `/dashboard/inquiries`
    - `/dashboard/recommendations`
    - `/dashboard/properties`
    - `/dashboard/properties/new`
    - `/dashboard/properties/[id]`
- Admin:
    - `/admin`
    - `/admin/properties`
    - `/admin/inquiries`
    - `/admin/user-signals`
    - `/admin/user-signals/new`
    - `/admin/user-signals/[id]`
    - `/admin/user-demands`
    - `/admin/user-demands/[id]`
    - `/admin/data-sources`, `/admin/data-sources/new`, `/admin/data-sources/[id]`
    - `/admin/source-imports`, `/admin/source-imports/json`, `/admin/source-imports/[id]`
    - `/admin/learning-jobs`, `/admin/learning-jobs/[id]`
    - `/admin/external-behaviors`
    - `/admin/users/[id]/intents`

## Feature Wrappers

Feature API calls di qua wrappers trong `client/src/features`:

- `auth`
- `users`
- `properties`
- `favorites`
- `inquiries`
- `admin`
- `admin-user-signals`
- `admin-user-demands`
- `recommendations`
- `user-behaviors`
- `user-preferences`
- `admin-data-sources`
- `admin-source-imports`
- `admin-learning`

Khong goi `fetch` truc tiep trong nhieu page/component khi wrapper da co.

## Current Behavior

- `/properties` sync search/filter/sort qua URL query.
- Protected API dung token trong `localStorage`.
- User dashboard recommendations dung `GET /recommendations/me`.
- Recommendation feedback dung `POST /recommendations/matches/:matchId/feedback`.
- Recompute recommendation dung `POST /recommendations/me/recompute`.
- Behavior tracking chi chay khi co token va phai catch loi de khong lam hong UI chinh.
- Dashboard recommendation tu refetch trong thoi gian background learning dang cap nhat.
- Public property detail co metadata, canonical, JSON-LD; sitemap chi lay property public va robots chan admin/dashboard/auth.

## Styling

- CSS chinh nam trong `client/src/app/globals.css`.
- UI dung CSS thuong, responsive.
- Khong them Tailwind/shadcn/MUI neu chua duoc yeu cau.
- Khong co page/link/form raw-property ingestion; source import UI chi cho `USER_SIGNAL` va `EXTERNAL_BEHAVIOR`.
