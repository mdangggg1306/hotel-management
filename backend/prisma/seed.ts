import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Xóa sạch dữ liệu cũ
  await prisma.payment.deleteMany()
  await prisma.upsell.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.room.deleteMany()
  await prisma.roomType.deleteMany()
  await prisma.user.deleteMany()

  // Create Admin User
  const adminPassword = await bcrypt.hash('123456', 10);
  await prisma.user.create({
    data: {
      full_name: 'Super Admin',
      email: 'admin@luxuryhotel.com',
      password_hash: adminPassword,
      role: 'ADMIN'
    }
  });

  const imagePools = {
    bedroom: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80',
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=900&q=80',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=900&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=900&q=80',
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=900&q=80',
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=900&q=80',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&q=80',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=900&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80'
    ],
    bathroom: [
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=900&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=900&q=80',
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=900&q=80'
    ],
    view: [
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=900&q=80',
      'https://images.unsplash.com/photo-1600607686527-6fb886090705?w=900&q=80',
      'https://images.unsplash.com/photo-1598928506311-c55dd1b31bb1?w=900&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=900&q=80'
    ],
    living: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80',
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=900&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=900&q=80'
    ]
  };

  const getRandomImage = (type: 'bedroom' | 'bathroom' | 'view' | 'living') => {
    const pool = imagePools[type];
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const get4Images = (mainImageIndex: number) => {
    return [
      imagePools.bedroom[mainImageIndex % imagePools.bedroom.length],
      getRandomImage('bathroom'),
      getRandomImage('living'),
      getRandomImage('view')
    ]
  };

  const roomTemplates = [
    {
      name: 'Azure Ocean Suite', price: 1200000, desc: 'Phòng Suite cao cấp với ban công rộng nhìn thẳng ra đại dương xanh mát. Nội thất tinh tế mang âm hưởng biển cả.',
      badge: 'ƯU ĐÃI THÀNH VIÊN GOLD ELITE', badgeClass: 'badge-gold',
      area: '85 m2', beds: '1 Giường King', capacity: 'Tối đa 2 Khách', view: 'Ocean View',
      tags: ['Free Wifi', 'AC', 'Bath', 'Ocean View'], tagIcons: ['📶', '❄️', '🛁', '🌊'],
      amenities: ['Ban công riêng', 'Bồn tắm sục Jacuzzi', 'Minibar miễn phí', 'Smart TV 65"']
    },
    {
      name: 'Royal Penthouse', price: 4500000, desc: 'Căn Penthouse hoàng gia sang trọng bậc nhất nằm trên tầng cao nhất của khách sạn, đặc quyền quản gia 24/7.',
      badge: 'ĐỘC QUYỀN', badgeClass: 'badge-signature',
      area: '250 m2', beds: '2 Giường King', capacity: 'Tối đa 4 Khách', view: 'Toàn cảnh thành phố',
      tags: ['Private Pool', '24/7 Service', 'Mini Bar'], tagIcons: ['🏊', '🛎', '🍸'],
      amenities: ['Hồ bơi vô cực riêng', 'Quản gia cá nhân', 'Phòng xông hơi khô', 'Rạp chiếu phim mini']
    },
    {
      name: 'Grand Garden Villa', price: 2800000, desc: 'Biệt thự trệt sân vườn biệt lập, ngập tràn mảng xanh và hoa tươi. Phù hợp cho gia đình hoặc cặp đôi cần sự riêng tư.',
      badge: 'MỚI NHẤT', badgeClass: 'badge-new',
      area: '150 m2', beds: '1 Giường King, 2 Giường Đơn', capacity: 'Tối đa 4 Khách', view: 'Hướng Vườn',
      tags: ['Garden', 'Breakfast', 'VIP Access'], tagIcons: ['🌿', '🍳', '🌟'],
      amenities: ['Sân vườn nướng BBQ', 'Lối đi VIP riêng', 'Bếp tiện nghi', 'Khu vực ăn uống ngoài trời']
    },
    {
      name: 'Executive Deluxe', price: 950000, desc: 'Phòng Deluxe sang trọng chuẩn doanh nhân, góc làm việc rộng rãi cùng tầm nhìn đẹp lung linh về đêm.',
      badge: '', badgeClass: '',
      area: '45 m2', beds: '1 Giường Queen', capacity: 'Tối đa 2 Khách', view: 'Hướng Thành Phố',
      tags: ['Workspace', 'Smart TV'], tagIcons: ['💼', '📺'],
      amenities: ['Bàn làm việc lớn', 'Ghế Ergonomic', 'Internet cáp quang', 'Máy pha cà phê Espresso']
    },
    {
      name: 'Heritage Terrace Room', price: 1550000, desc: 'Căn phòng mang đậm nét kiến trúc Đông Dương, kết hợp sân hiên rộng để thưởng trà chiều.',
      badge: '', badgeClass: '',
      area: '65 m2', beds: '1 Giường King', capacity: 'Tối đa 2 Khách', view: 'Ban công',
      tags: ['Balcony', 'Heritage'], tagIcons: ['🌅', '🏛️'],
      amenities: ['Nội thất gỗ thủ công', 'Ban công rộng 15m2', 'Bộ ấm trà cao cấp', 'Bồn tắm chân rồng']
    },
    {
      name: 'Skyline Studio', price: 880000, desc: 'Studio hiện đại ngắm trọn vẹn đường chân trời thành phố. Không gian mở với bếp nhỏ tiện lợi.',
      badge: 'ƯU ĐÃI GIỜ VÀNG', badgeClass: 'badge-gold',
      area: '50 m2', beds: '1 Giường Queen', capacity: 'Tối đa 2 Khách', view: 'City View',
      tags: ['City View', 'Kitchenette'], tagIcons: ['🏙️', '🍳'],
      amenities: ['Bếp nhỏ (Kitchenette)', 'Tủ lạnh lớn', 'Máy giặt sấy', 'Cửa sổ kính sát trần']
    }
  ];

  const variants = [
    { suffix: '', priceMultiplier: 1, loc: 'Khu Trung Tâm' },
    { suffix: ' - Tòa A (Khu Biển)', priceMultiplier: 1.15, loc: 'Tòa A - Sát Biển' },
    { suffix: ' - Tòa B (Khu Đồi)', priceMultiplier: 0.85, loc: 'Tòa B - Gần Đồi' }
  ];

  let imageCounter = 0;

  // Generate 18 rooms
  for (let v = 0; v < variants.length; v++) {
    for (let i = 0; i < roomTemplates.length; i++) {
      const template = roomTemplates[i];
      const newPrice = Math.round(template.price * variants[v].priceMultiplier / 10000) * 10000;
      
      const createdRoomType = await prisma.roomType.create({
        data: {
          name: template.name + variants[v].suffix,
          base_price: newPrice,
          description: `(Vị trí: ${variants[v].loc}) - ${template.desc}`,
          badge: template.badge,
          badgeClass: template.badgeClass,
          area: template.area,
          beds: template.beds,
          capacity: template.capacity,
          view: template.view,
          tags: template.tags,
          tagIcons: template.tagIcons,
          images: get4Images(imageCounter++), // Cấp 4 ảnh cho mỗi phòng để xem chi tiết Gallery
          amenities: [...template.amenities, 'Két sắt điện tử', 'Dịch vụ dọn phòng 2 lần/ngày'],
          reviewCount: Math.floor(Math.random() * 200) + 15,
          serviceFee: Math.round(newPrice * 0.05),
          tax: Math.round(newPrice * 0.08),
        }
      });

      // Tạo room vật lý
      await prisma.room.create({
        data: {
          room_number: `${template.name.charAt(0)}${v + 1}-${i + 1}01`,
          room_type_id: createdRoomType.id
        }
      });
    }
  }

  console.log('Seeded database successfully with 18 distinct Rooms and Galleries!')
}

main()
  .catch(e => {
    console.error(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
