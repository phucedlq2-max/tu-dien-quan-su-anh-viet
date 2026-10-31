# Từ điển Quân sự Anh – Việt

Ứng dụng web tĩnh, không cần máy chủ riêng. Có thể triển khai trên GitHub Pages.

## Tính năng
- Tra cứu thuật ngữ Anh–Việt và lọc theo nghĩa tiếng Việt, chủ đề, thẻ.
- Phiên âm IPA cho bộ từ tích hợp; nút phát âm dùng giọng tiếng Anh của trình duyệt.
- Ví dụ tiếng Anh và bản dịch tiếng Việt.
- Lưu/bỏ lưu từ yêu thích bằng `localStorage` trên trình duyệt hiện tại.
- Thẻ ôn tập; nếu có từ yêu thích, ưu tiên ôn các từ đó.
- Bài kiểm tra trắc nghiệm 10 câu.
- Tra cứu mở rộng định nghĩa tiếng Anh qua DictionaryAPI.dev khi có Internet.
- Giao diện sáng/tối và bộ nhớ đệm cơ bản qua service worker.

## Chạy thử trên máy tính
Do trình duyệt thường chặn `fetch()` với tệp JSON khi mở trực tiếp bằng `file://`, nên chạy qua máy chủ tĩnh cục bộ. Nếu đã cài Python:

```bash
python -m http.server 8000
```

Sau đó mở `http://localhost:8000`.

## Triển khai lên GitHub Pages
1. Đăng nhập GitHub và chọn **New repository**.
2. Đặt tên, ví dụ `tu-dien-quan-su-anh-viet`. Chọn Public nếu muốn dùng GitHub Pages miễn phí theo thiết lập phổ biến.
3. Tải lên toàn bộ các tệp trong thư mục này: `index.html`, `styles.css`, `app.js`, `vocabulary.json`, `manifest.json`, `favicon.svg`, `sw.js`, `README.md`.
4. Vào **Settings → Pages**.
5. Trong **Build and deployment**, chọn **Deploy from a branch**.
6. Chọn branch `main`, folder `/(root)`, bấm **Save**.
7. Đợi GitHub hoàn tất triển khai. Địa chỉ thường có dạng:
   `https://TEN-TAI-KHOAN.github.io/tu-dien-quan-su-anh-viet/`
   Thay `TEN-TAI-KHOAN` bằng tên tài khoản GitHub thực tế.

## Thêm/sửa thuật ngữ
Mở `vocabulary.json`. Mỗi thuật ngữ là một đối tượng JSON gồm:
- `term`: từ/cụm từ tiếng Anh
- `ipa`: phiên âm
- `pos`: từ loại
- `meaning`: nghĩa tiếng Việt
- `category`: nhóm chủ đề
- `example_en`: ví dụ tiếng Anh
- `example_vi`: bản dịch ví dụ
- `tags`: danh sách từ khóa

Sau khi sửa, tải tệp mới lên GitHub hoặc commit/push thay đổi. Bộ từ điển sẽ được cập nhật sau khi Pages triển khai lại.

## Giới hạn cần biết
- Bộ dữ liệu khởi đầu là bộ từ mẫu có chọn lọc, không phải từ điển quân sự chính thức hoặc đầy đủ. Các thuật ngữ đa nghĩa cần được hiệu đính theo giáo trình, quân chủng, quốc gia và ngữ cảnh.
- Tra cứu mở rộng hiện dùng DictionaryAPI.dev để lấy định nghĩa tiếng Anh và IPA nếu có; dịch tiếng Việt không tự động được đảm bảo cho mọi từ. Kết quả mở rộng chưa có bản dịch chuyên ngành cần được người dùng bổ sung/kiểm tra.
- Phát âm phụ thuộc giọng đọc có sẵn trên thiết bị/trình duyệt. Không phải trình duyệt nào cũng có cùng giọng.
- Yêu thích được lưu riêng trên trình duyệt/thiết bị; không đồng bộ giữa các thiết bị và có thể mất khi xóa dữ liệu trình duyệt.
- Service worker giúp lưu bộ tệp tĩnh cho lần truy cập sau, nhưng tra cứu mở rộng vẫn cần Internet. Chức năng này hoạt động khi chạy qua HTTPS hoặc localhost.
- GitHub Pages phục vụ website tĩnh; không có cơ sở dữ liệu người dùng hoặc đăng nhập dùng chung.

## Quyền sử dụng và kiểm tra
Đây là mã nguồn mẫu có thể chỉnh sửa. Trước khi dùng làm tài liệu giảng dạy chính thức, hãy rà soát phiên âm, thuật ngữ và ví dụ. Không đưa dữ liệu nội bộ hoặc tài liệu hạn chế lên repository công khai.


## Hiệu đính bước đầu
- Đã sửa một số lỗi chính tả tiếng Anh/tiếng Việt và lỗi OCR rõ ràng, chuẩn hóa một số thuật ngữ AK.
- Các trường `original_term` và `original_meaning` lưu lại nội dung trước khi sửa để truy vết.
- Mục được sửa có trạng thái `Đã sửa lỗi rõ ràng; cần rà soát chuyên ngành`.
- Những cụm tiếng Anh có vẻ sai nhưng không đủ căn cứ để khôi phục chính xác được giữ nguyên và cần chuyên gia đối chiếu. Không tự động đoán nghĩa khi có nhiều khả năng.
- Phiên âm IPA và ví dụ song ngữ chưa được tự tạo hàng loạt vì cần bảo đảm phát âm/ngữ cảnh chuyên ngành chính xác.


## Hiệu đính mở rộng (bản dự thảo)
- Đã tiếp tục sửa các lỗi chính tả/OCR tiếng Anh và tiếng Việt có khả năng nhận diện, đồng thời diễn giải lại một số bản dịch có dấu hiệu sai nghĩa rõ.
- Với các mục được suy đoán, giữ `original_term` và `original_meaning`, gắn trạng thái `Hiệu đính / suy đoán — cần thẩm định`.
- Một số thuật ngữ quân sự phụ thuộc hệ thống vũ khí, điều lệnh, quân đội và ngữ cảnh. Các sửa đổi như vậy là đề xuất biên tập, không phải xác nhận chính thức.

## Tra cứu hai chiều Anh–Việt / Việt–Anh

Phiên bản cập nhật hỗ trợ ba chế độ tìm kiếm:
- **Tự động cả hai chiều**: tìm cả thuật ngữ tiếng Anh và nghĩa tiếng Việt.
- **Anh → Việt**: ưu tiên tìm từ/cụm từ tiếng Anh rồi hiển thị nghĩa tiếng Việt.
- **Việt → Anh**: tìm nghĩa hoặc cụm từ tiếng Việt để tìm thuật ngữ tiếng Anh tương ứng.

Tìm kiếm không phân biệt chữ hoa/thường và dấu tiếng Việt. Kết quả được tìm trong thuật ngữ, nghĩa chính, nghĩa khác, ví dụ và một số trường dữ liệu liên quan. Dữ liệu từ vựng vẫn cần thẩm định chuyên ngành trước khi dùng chính thức.


## Tra cứu/dịch trực tuyến hai chiều
Nút tra cứu Internet sử dụng MyMemory Translation API để dịch cả Việt → Anh và Anh → Việt; với từ tiếng Anh đơn, ứng dụng có thể bổ sung định nghĩa/phiên âm từ DictionaryAPI.dev. Dịch vụ công cộng có giới hạn sử dụng và kết quả dịch máy không bảo đảm chính xác, đặc biệt với thuật ngữ quân sự. Luôn đối chiếu với từ điển chuyên ngành và tài liệu chính thức.


## Mở ChatGPT khi không tìm thấy thuật ngữ

Ứng dụng luôn tra bộ từ vựng nội bộ trước. Nếu không có kết quả, người dùng có thể bấm **Hỏi ChatGPT về thuật ngữ này** để mở ChatGPT với câu hỏi dịch đã điền sẵn theo chiều tra cứu. Không dùng API key và không tự động lấy kết quả từ ChatGPT về ứng dụng; người dùng cần đăng nhập (nếu được yêu cầu) và gửi câu hỏi trong ChatGPT. Kết quả chỉ là bản dịch tham khảo, không sửa dữ liệu từ điển.


## Sử dụng ngoại tuyến (offline)

- Ứng dụng có Service Worker lưu bộ giao diện và `vocabulary.json` vào bộ nhớ đệm của trình duyệt.
- Người dùng cần mở ứng dụng khi có Internet ít nhất một lần và chờ tải xong dữ liệu trước khi ngắt mạng.
- Sau khi cập nhật phiên bản mới, mở ứng dụng online một lần để nhận mã mới. Nếu trình duyệt vẫn dùng bản cũ, đóng các tab của ứng dụng rồi mở lại hoặc xóa dữ liệu website trong cài đặt trình duyệt.
- Tra cứu bộ từ vựng nội bộ, từ yêu thích, ôn tập và kiểm tra có thể dùng offline khi dữ liệu đã được lưu. Mở ChatGPT, tra cứu Internet và các tính năng trực tuyến khác cần mạng.
- Trên Android, dùng Chrome mở website → menu ⋮ → **Cài đặt ứng dụng** hoặc **Thêm vào màn hình chính** (tên tùy phiên bản Chrome).
- Trên iPhone/iPad, dùng Safari → Chia sẻ → **Thêm vào Màn hình chính**.
- Offline phụ thuộc trình duyệt và dung lượng bộ nhớ; xóa dữ liệu website có thể làm mất bộ nhớ đệm. Từ yêu thích được lưu cục bộ trên từng trình duyệt/thiết bị.


## ENGARMY Offline PWA update
- Developer information is displayed near the top, immediately below the main header.
- Removed duplicate developer information from the footer.
- Service worker cache version bumped to refresh the update.


## Logo ứng dụng
Logo chính thức do người phát triển cung cấp được dùng tại biểu tượng đầu trang, favicon và biểu tượng PWA `icon-192.png` / `icon-512.png`. Khi cập nhật GitHub, giữ nguyên `CNAME` của tên miền nếu kho đang có tệp này.
