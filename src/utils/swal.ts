import Swal from 'sweetalert2';

export const nuaSwal = Swal.mixin({
  customClass: {
    popup: 'rounded-3xl border border-[#F0E7C2] shadow-2xl font-sans',
    title: 'font-black text-[#58111B]',
    htmlContainer: 'text-slate-700 font-medium',
    confirmButton: 'bg-[#8B1C2D] hover:bg-[#6e1422] text-white font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition',
    cancelButton: 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl cursor-pointer mr-2 transition',
  },
  buttonsStyling: false,
});

export const showSuccessAlert = (title: string, text?: string) => {
  return nuaSwal.fire({
    icon: 'success',
    title,
    text,
    iconColor: '#8B1C2D',
    confirmButtonText: 'ตกลง',
  });
};

export const showErrorAlert = (title: string, text?: string) => {
  return nuaSwal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'ตกลง',
  });
};

export const showToast = (title: string, icon: 'success' | 'info' | 'warning' | 'error' = 'success') => {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    iconColor: icon === 'success' ? '#8B1C2D' : undefined,
    customClass: {
      popup: 'rounded-2xl border border-[#F0E7C2] shadow-lg font-sans',
    }
  });
};

export const showConfirmDialog = async (
  title: string, 
  text?: string, 
  confirmText: string = 'ยืนยัน', 
  cancelText: string = 'ยกเลิก'
): Promise<boolean> => {
  const result = await nuaSwal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    iconColor: '#8B1C2D',
  });
  return result.isConfirmed;
};
