import { useMutation } from "react-query";
import { useNavigate } from "react-router-dom";
import { ReactComponent as DeleteIcon } from "../../assets/images/Close.svg";
import { API_PATHS } from "../../constants/path";
import { CONFIRM, FAIL, SUCCESS } from "../../constants/systemMessage";
import { useModal } from "../../hooks/useModal";
import { authInstance } from "../../interceptors/interceptors";
import Button from "../common/Button";
import Modal from "../common/Modal";
import { ProductData } from "./List";

type DeleteButtonProps = {
  data: ProductData;
  modalMessage: { [key: string]: string };
  setModalMessage: React.Dispatch<React.SetStateAction<{ title: string; description: string }>>;
};

const DeleteButton = ({ data, modalMessage, setModalMessage }: DeleteButtonProps) => {
  const { isOpen, setIsOpen, closeModal, toggleModal } = useModal();
  const { mutate, error } = useMutation(async (id: number) => {
    await authInstance.delete(API_PATHS.products.default(id));
  });
  const navigate = useNavigate();

  const handleDelete = async (id: number) => {
    mutate(id);

    if (!error) {
      setModalMessage({ title: "상품 삭제 성공", description: SUCCESS.delete });
    } else {
      setModalMessage({ title: "상품 삭제 실패", description: FAIL.delete });
    }
  };

  return (
    <>
      <DeleteIcon
        onClick={() => {
          setIsOpen(true);
          setModalMessage({
            title: "상품 삭제",
            description: CONFIRM.delete,
          });
        }}
      />
      <Modal {...{ isOpen, closeModal, toggleModal }}>
        <>
          <h4>{modalMessage.title}</h4>
          <p>{modalMessage.description}</p>
          {modalMessage.title === "상품 삭제" && (
            <div className="button">
              <Button
                $design="outline"
                $text="취소"
                type="button"
                onClick={() => {
                  setIsOpen(!isOpen);
                }}
              />
              <Button
                $design="black"
                $text="확인"
                type="button"
                onClick={() => {
                  handleDelete(data.productId);
                }}
              />
            </div>
          )}
          {modalMessage.title === "상품 삭제 성공" && (
            <Button
              $design="black"
              $text="확인"
              type="button"
              onClick={() => {
                navigate("/product");
              }}
            />
          )}
        </>
      </Modal>
    </>
  );
};

export default DeleteButton;
