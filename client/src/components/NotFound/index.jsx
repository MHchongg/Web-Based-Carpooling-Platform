import { useNavigate } from 'react-router-dom'
import { Button } from "@mui/material"
import { styled } from '@mui/material/styles';
import { orange } from '@mui/material/colors';
import './index.scss'

const MyButton = styled(Button)(({ theme }) => ({
    backgroundColor: orange[500],
    color: 'white',
    '&:hover': {
        backgroundColor: orange[700],
    },
    '&:disabled': {
        backgroundColor: "#ccc",
    }
}));

function NotFound () {

    const navigate = useNavigate()

    return (
        <>
            <section className="page_404">
                <div className="container">
                    <div>
                        <div>
                            <div>
                                <div className="four_zero_four_bg">
                                    <h1>404 Not Found</h1>
                                </div>

                                <div className="contant_box_404">
                                    <h3>
                                        Look like you're lost
                                    </h3>

                                    <p style={{ marginBottom: '1rem' }}>The page you are looking for is not available or has already expired.</p>

                                    <MyButton onClick={() => navigate(-1)} sx={{ marginBottom: '1.5rem' }}>Back to previous page</MyButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default NotFound